import type { Enemy, GameInput, GameSnapshot, Orb, Platform, RulePair, Vec } from './game-types';
import { deriveWorld, nextRulePair, pairTitle, ROUND_SECONDS, type WorldRules } from './rules';

const WIDTH = 960;
const HEIGHT = 540;
const PLAYER_RADIUS = 13;
const STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 4;
const ENEMY_SUPPORT_HALF_WIDTH = 28;
/* 도형이 전부 단색 프리미티브라 1920px을 넘겨도 선명도 차이는 없고 픽셀 채우기 비용만 커진다. */
const MAX_BACKING_WIDTH = 1920;

type Player = Vec & { vx: number; vy: number; grounded: boolean; dashCooldown: number };
type Comet = Vec & { vy: number; active: boolean };

function withinRadius(ax: number, ay: number, bx: number, by: number, radius: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy < radius * radius;
}

export class RuleMachineGame {
  private readonly context: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private input: GameInput = { left: false, right: false, jump: false, dash: false };
  private player: Player = { x: 132, y: 400, vx: 0, vy: 0, grounded: false, dashCooldown: 0 };
  private platforms: Platform[] = [];
  private bridgePlatforms: Platform[] = [];
  private enemies: Enemy[] = [];
  private orbs: Orb[] = [];
  private comets: Comet[] = [];
  private pair: RulePair = ['enemy-platform', 'orb-magnet'];
  private world: WorldRules = deriveWorld(this.pair);
  private active = false;
  private won = false;
  private elapsed = 0;
  private roundRemaining = ROUND_SECONDS;
  private score = 0;
  private integrity = 3;
  private flash = 1;
  private message = '기계가 다음 규칙 충돌을 계산합니다.';
  private lastTimestamp = 0;
  private raf = 0;
  private accumulator = 0;
  private pendingJump = false;
  private pendingDash = false;
  private dirty = true;
  private resizeQueued = false;
  private scaleX = 1;
  private scaleY = 1;
  private gridCanvas: HTMLCanvasElement | null = null;
  private gridKey = '';
  private readonly support: Platform[] = [];
  private readonly enemySupport: Platform[] = [];
  private publishedScore = -1;
  private publishedIntegrity = -1;
  private publishedSeconds = -1;
  private publishedActive = false;
  private publishedWon = false;
  private publishedMessage = '';
  private publishedPair: RulePair | null = null;
  private onSnapshot: (snapshot: GameSnapshot) => void;
  private onSound: (tone: 'start' | 'jump' | 'collect' | 'shift' | 'hurt' | 'win') => void;

  constructor(
    canvas: HTMLCanvasElement,
    onSnapshot: (snapshot: GameSnapshot) => void,
    onSound: (tone: 'start' | 'jump' | 'collect' | 'shift' | 'hurt' | 'win') => void,
  ) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D를 사용할 수 없습니다.');
    this.canvas = canvas;
    this.context = context;
    this.onSnapshot = onSnapshot;
    this.onSound = onSound;
    this.resetWorld();
    this.applyResize();
    this.publish();
  }

  start() {
    this.active = true;
    this.won = false;
    this.score = 0;
    this.integrity = 3;
    this.elapsed = 0;
    this.accumulator = 0;
    this.roundRemaining = ROUND_SECONDS;
    this.message = '규칙은 당신보다 빠르게 변합니다. 별 12개를 회수하세요.';
    this.resetWorld();
    this.dirty = true;
    this.onSound('start');
    this.publish();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /* 리사이즈 이벤트는 초당 수십 번 몰아치므로 한 프레임에 한 번만 반영한다. */
  resize() {
    if (this.resizeQueued) return;
    this.resizeQueued = true;
    requestAnimationFrame(() => {
      this.resizeQueued = false;
      this.applyResize();
    });
  }

  setInput(next: Partial<GameInput>) {
    if (next.jump && !this.input.jump) this.pendingJump = true;
    if (next.dash && !this.input.dash) this.pendingDash = true;
    if (next.left !== undefined) this.input.left = next.left;
    if (next.right !== undefined) this.input.right = next.right;
    if (next.jump !== undefined) this.input.jump = next.jump;
    if (next.dash !== undefined) this.input.dash = next.dash;
  }

  forceShift() {
    if (!this.active) this.start();
    this.shiftRules();
  }

  frame = (timestamp: number) => {
    const raw = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    if (this.active && !this.won) {
      const delta = Math.min(0.25, Math.max(0, raw || 0));
      this.accumulator = Math.min(this.accumulator + delta, STEP * MAX_STEPS_PER_FRAME);
      while (this.accumulator >= STEP) {
        this.accumulator -= STEP;
        this.update(STEP);
        if (this.won) break;
      }
      this.dirty = true;
    }
    if (this.dirty) {
      this.draw();
      this.dirty = false;
    }
    this.publishIfChanged();
    this.raf = requestAnimationFrame(this.frame);
  };

  run() {
    this.lastTimestamp = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private applyResize() {
    const rect = this.canvas.getBoundingClientRect();
    /* 폰 폭에서 16:9 높이는 220px보다 작다. 하한을 크게 잡으면 화면이 세로로 눌린다. */
    const width = Math.max(160, rect.width || WIDTH);
    const height = Math.max(90, rect.height || (width * HEIGHT) / WIDTH);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, MAX_BACKING_WIDTH / width);
    const nextWidth = Math.round(width * pixelRatio);
    const nextHeight = Math.round(height * pixelRatio);
    if (this.canvas.width !== nextWidth || this.canvas.height !== nextHeight) {
      this.canvas.width = nextWidth;
      this.canvas.height = nextHeight;
    }
    this.scaleX = nextWidth / WIDTH;
    this.scaleY = nextHeight / HEIGHT;
    this.context.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    this.draw();
    this.dirty = false;
  }

  private setPair(pair: RulePair) {
    this.pair = pair;
    this.world = deriveWorld(pair);
  }

  private resetWorld() {
    const rules = this.world;
    this.player = {
      x: 116,
      y: rules.gravity === 1 ? 450 : 88,
      vx: 0,
      vy: 0,
      grounded: false,
      dashCooldown: 0,
    };
    this.platforms = [
      { x: 170, y: 410, width: 160, height: 16 },
      { x: 450, y: 350, width: 130, height: 16 },
      { x: 690, y: 260, width: 120, height: 16 },
      { x: 355, y: 185, width: 110, height: 16 },
      { x: 710, y: 110, width: 145, height: 16 },
    ];
    this.bridgePlatforms = [];
    this.enemies = [
      { x: 350, y: 355, baseY: 355, phase: 0.8, radius: 18 },
      { x: 610, y: 270, baseY: 270, phase: 2.6, radius: 18 },
      { x: 835, y: 390, baseY: 390, phase: 4.1, radius: 18 },
    ];
    this.enemySupport.length = 0;
    for (const enemy of this.enemies) {
      this.enemySupport.push({ x: enemy.x - ENEMY_SUPPORT_HALF_WIDTH, y: enemy.y, width: 56, height: 12 });
    }
    this.orbs = [
      [245, 340], [505, 280], [610, 440], [750, 190], [860, 330], [405, 110], [150, 250], [565, 125], [900, 88], [300, 480], [700, 455], [880, 235],
    ].map(([x, y], index) => ({ x, y, active: true, phase: index * 0.7 }));
    this.comets = [];
    this.dirty = true;
  }

  private update(delta: number) {
    this.elapsed += delta;
    this.roundRemaining -= delta;
    this.flash = Math.max(0, this.flash - delta * 1.4);
    if (this.roundRemaining <= 0) this.shiftRules();
    const world = this.world;
    this.moveEnemies(delta);
    this.movePlayer(delta, world);
    this.moveOrbs(delta, world);
    this.moveComets(delta, world);
    this.collectOrbs();
    if (this.score >= 12) {
      this.won = true;
      this.message = `RULEBREAKER. ${Math.floor(this.elapsed)}초 동안 ${this.score}개의 한계를 훔쳤습니다.`;
      this.onSound('win');
      this.publish();
    }
  }

  private moveEnemies(delta: number) {
    for (let index = 0; index < this.enemies.length; index += 1) {
      const enemy = this.enemies[index];
      enemy.phase += delta * 1.7;
      enemy.y = enemy.baseY + Math.sin(enemy.phase) * 38;
      const support = this.enemySupport[index];
      if (support) support.y = enemy.y;
    }
  }

  private movePlayer(delta: number, world: WorldRules) {
    const direction = Number(this.input.right) - Number(this.input.left);
    this.player.vx += direction * 1750 * delta;
    this.player.vx *= Math.pow(0.0006, delta);
    this.player.vx = Math.max(-260, Math.min(260, this.player.vx));
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - delta);

    if (this.pendingJump && this.player.grounded) {
      this.player.vy = -world.gravity * 495;
      this.player.grounded = false;
      this.onSound('jump');
    }
    this.pendingJump = false;
    if (this.pendingDash && this.player.dashCooldown === 0) {
      const dashDirection = direction || (this.player.vx >= 0 ? 1 : -1);
      this.player.vx = dashDirection * 590;
      this.player.dashCooldown = 0.8;
      if (world.dashBridge) {
        this.bridgePlatforms.push({
          x: this.player.x - 28,
          y: this.player.y + (world.gravity === 1 ? PLAYER_RADIUS + 10 : -PLAYER_RADIUS - 10),
          width: 58,
          height: 8,
          ttl: 2.2,
        });
      }
    }
    this.pendingDash = false;

    const beforeY = this.player.y;
    this.player.vy += 1240 * world.gravity * delta;
    this.player.x += this.player.vx * delta;
    this.player.y += this.player.vy * delta;
    if (world.phaseWalls) {
      if (this.player.x < -PLAYER_RADIUS) this.player.x = WIDTH + PLAYER_RADIUS;
      if (this.player.x > WIDTH + PLAYER_RADIUS) this.player.x = -PLAYER_RADIUS;
    } else {
      this.player.x = Math.max(PLAYER_RADIUS, Math.min(WIDTH - PLAYER_RADIUS, this.player.x));
    }

    this.player.grounded = false;
    const support = this.support;
    support.length = 0;
    for (const platform of this.platforms) support.push(platform);
    for (const platform of this.bridgePlatforms) support.push(platform);
    if (world.enemyPlatforms) {
      for (const platform of this.enemySupport) support.push(platform);
    }
    this.resolveGround(beforeY, support, world.gravity);
    this.pruneBridges(delta);

    if (!world.enemyPlatforms) {
      for (const enemy of this.enemies) {
        if (withinRadius(enemy.x, enemy.y, this.player.x, this.player.y, enemy.radius + PLAYER_RADIUS)) {
          this.damage('적이 발판이 아니었습니다.');
          break;
        }
      }
    }
    if (this.player.y < -50 || this.player.y > HEIGHT + 50) this.damage('경계 밖으로 밀려났습니다.');
  }

  /* 매 프레임 filter로 새 배열을 만들지 않도록 제자리에서 압축한다. */
  private pruneBridges(delta: number) {
    let write = 0;
    for (let index = 0; index < this.bridgePlatforms.length; index += 1) {
      const platform = this.bridgePlatforms[index];
      const ttl = (platform.ttl ?? 0) - delta;
      platform.ttl = ttl;
      if (ttl > 0) {
        this.bridgePlatforms[write] = platform;
        write += 1;
      }
    }
    this.bridgePlatforms.length = write;
  }

  private resolveGround(beforeY: number, platforms: Platform[], gravity: 1 | -1) {
    const floor = gravity === 1 ? HEIGHT - 32 : 32;
    if ((gravity === 1 && this.player.y + PLAYER_RADIUS >= floor) || (gravity === -1 && this.player.y - PLAYER_RADIUS <= floor)) {
      this.player.y = floor - gravity * PLAYER_RADIUS;
      this.player.vy = 0;
      this.player.grounded = true;
    }
    for (const platform of platforms) {
      const withinX = this.player.x + PLAYER_RADIUS > platform.x && this.player.x - PLAYER_RADIUS < platform.x + platform.width;
      if (!withinX) continue;
      if (gravity === 1 && beforeY + PLAYER_RADIUS <= platform.y && this.player.y + PLAYER_RADIUS >= platform.y && this.player.vy >= 0) {
        this.player.y = platform.y - PLAYER_RADIUS;
        this.player.vy = 0;
        this.player.grounded = true;
      }
      if (gravity === -1 && beforeY - PLAYER_RADIUS >= platform.y + platform.height && this.player.y - PLAYER_RADIUS <= platform.y + platform.height && this.player.vy <= 0) {
        this.player.y = platform.y + platform.height + PLAYER_RADIUS;
        this.player.vy = 0;
        this.player.grounded = true;
      }
    }
  }

  private moveOrbs(delta: number, world: WorldRules) {
    const magnet = world.magnetOrbs;
    for (const orb of this.orbs) {
      orb.phase += delta * 2;
      if (!orb.active || !magnet) continue;
      const dx = this.player.x - orb.x;
      const dy = this.player.y - orb.y;
      const squared = dx * dx + dy * dy;
      if (squared < 44100 && squared > 1) {
        const distance = Math.sqrt(squared);
        orb.x += (dx / distance) * delta * 240;
        orb.y += (dy / distance) * delta * 240;
      }
    }
  }

  private moveComets(delta: number, world: WorldRules) {
    if (world.cometRain && this.comets.length < 8 && Math.random() < delta * 2.8) {
      this.comets.push({ x: 40 + Math.random() * (WIDTH - 80), y: -18, vy: 220 + Math.random() * 190, active: true });
    }
    let write = 0;
    for (let index = 0; index < this.comets.length; index += 1) {
      const comet = this.comets[index];
      comet.y += comet.vy * delta;
      if (withinRadius(comet.x, comet.y, this.player.x, this.player.y, 21)) this.damage('혜성이 규칙보다 빨랐습니다.');
      if (comet.y > HEIGHT + 30) continue;
      this.comets[write] = comet;
      write += 1;
    }
    this.comets.length = write;
  }

  private collectOrbs() {
    for (const orb of this.orbs) {
      if (orb.active && withinRadius(orb.x, orb.y, this.player.x, this.player.y, 25)) {
        orb.active = false;
        this.score += 1;
        this.onSound('collect');
      }
    }
  }

  private damage(reason: string) {
    if (this.flash > 0.45) return;
    this.integrity -= 1;
    this.flash = 0.8;
    this.message = reason;
    this.onSound('hurt');
    if (this.integrity <= 0) {
      this.integrity = 3;
      this.score = Math.max(0, this.score - 2);
      this.message = '기계가 당신을 되감았습니다. 별 2개를 잃었습니다.';
    }
    this.player.x = 116;
    this.player.y = this.world.gravity === 1 ? 450 : 88;
    this.player.vx = 0;
    this.player.vy = 0;
    this.publish();
  }

  private shiftRules() {
    this.setPair(nextRulePair(this.pair));
    this.roundRemaining = ROUND_SECONDS;
    this.flash = 1;
    this.message = `세계 재컴파일: ${pairTitle(this.pair)}`;
    this.resetWorld();
    this.onSound('shift');
    this.publish();
  }

  /* 화면에 실제로 보이는 값이 바뀔 때만 React 상태를 갱신한다. */
  private publishIfChanged() {
    const seconds = Math.ceil(Math.max(0, this.roundRemaining));
    if (
      seconds === this.publishedSeconds &&
      this.score === this.publishedScore &&
      this.integrity === this.publishedIntegrity &&
      this.active === this.publishedActive &&
      this.won === this.publishedWon &&
      this.message === this.publishedMessage &&
      this.pair === this.publishedPair
    ) {
      return;
    }
    this.publish();
  }

  private publish() {
    this.publishedSeconds = Math.ceil(Math.max(0, this.roundRemaining));
    this.publishedScore = this.score;
    this.publishedIntegrity = this.integrity;
    this.publishedActive = this.active;
    this.publishedWon = this.won;
    this.publishedMessage = this.message;
    this.publishedPair = this.pair;
    this.onSnapshot({
      active: this.active,
      score: this.score,
      integrity: this.integrity,
      elapsed: this.elapsed,
      roundRemaining: Math.max(0, this.roundRemaining),
      pair: this.pair,
      headline: pairTitle(this.pair),
      message: this.message,
      won: this.won,
    });
  }

  /* 배경 격자는 리사이즈나 중력 반전 때만 다시 그리고 평소에는 통째로 복사한다. */
  private buildGrid() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (width === 0 || height === 0) return;
    const key = `${this.world.gravity}:${width}x${height}`;
    if (key === this.gridKey && this.gridCanvas) return;
    const grid = this.gridCanvas ?? document.createElement('canvas');
    this.gridCanvas = grid;
    grid.width = width;
    grid.height = height;
    const layer = grid.getContext('2d', { alpha: false });
    if (!layer) {
      this.gridCanvas = null;
      return;
    }
    this.gridKey = key;
    layer.setTransform(width / WIDTH, 0, 0, height / HEIGHT, 0, 0);
    layer.fillStyle = '#071217';
    layer.fillRect(0, 0, WIDTH, HEIGHT);
    layer.strokeStyle = 'rgba(131, 206, 201, 0.14)';
    layer.lineWidth = 1;
    layer.beginPath();
    for (let x = 0; x <= WIDTH; x += 48) {
      layer.moveTo(x, 0);
      layer.lineTo(x, HEIGHT);
    }
    for (let y = 0; y <= HEIGHT; y += 48) {
      layer.moveTo(0, y);
      layer.lineTo(WIDTH, y);
    }
    layer.stroke();
    const floor = this.world.gravity === 1 ? HEIGHT - 32 : 32;
    layer.strokeStyle = '#ffbd4a';
    layer.lineWidth = 3;
    layer.beginPath();
    layer.moveTo(0, floor);
    layer.lineTo(WIDTH, floor);
    layer.stroke();
  }

  private draw() {
    const context = this.context;
    const world = this.world;
    this.buildGrid();
    if (this.gridCanvas) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.drawImage(this.gridCanvas, 0, 0);
      context.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    } else {
      context.fillStyle = '#071217';
      context.fillRect(0, 0, WIDTH, HEIGHT);
    }
    this.drawPlatforms(context, world);
    this.drawOrbs(context);
    this.drawEnemies(context, world);
    this.drawComets(context);
    this.drawPlayer(context);
    if (this.flash > 0) {
      context.fillStyle = `rgba(255, 244, 214, ${this.flash * 0.23})`;
      context.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  /* 같은 색끼리 묶어 fillStyle 전환 횟수를 줄인다. */
  private drawPlatforms(context: CanvasRenderingContext2D, world: WorldRules) {
    context.fillStyle = '#6ee7e0';
    for (const platform of this.platforms) context.fillRect(platform.x, platform.y, platform.width, platform.height);
    if (this.bridgePlatforms.length > 0) {
      context.fillStyle = '#ff6c7a';
      for (const platform of this.bridgePlatforms) context.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
    if (world.enemyPlatforms) {
      context.fillStyle = '#ffbd4a';
      for (const platform of this.enemySupport) context.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
    context.fillStyle = 'rgba(7, 18, 23, .8)';
    this.drawStuds(context, this.platforms);
    this.drawStuds(context, this.bridgePlatforms);
    if (world.enemyPlatforms) this.drawStuds(context, this.enemySupport);
  }

  private drawStuds(context: CanvasRenderingContext2D, platforms: Platform[]) {
    for (const platform of platforms) {
      const end = platform.x + platform.width;
      for (let x = platform.x + 8; x < end; x += 16) context.fillRect(x, platform.y + 4, 5, 3);
    }
  }

  private drawOrbs(context: CanvasRenderingContext2D) {
    context.fillStyle = 'rgba(164, 182, 255, .13)';
    context.beginPath();
    for (const orb of this.orbs) {
      if (!orb.active) continue;
      const radius = 7 + Math.sin(orb.phase) * 1.5;
      context.moveTo(orb.x + radius + 5, orb.y);
      context.arc(orb.x, orb.y, radius + 5, 0, Math.PI * 2);
    }
    context.fill();
    context.fillStyle = '#a4b6ff';
    context.beginPath();
    for (const orb of this.orbs) {
      if (!orb.active) continue;
      const radius = 7 + Math.sin(orb.phase) * 1.5;
      context.moveTo(orb.x + radius, orb.y);
      context.arc(orb.x, orb.y, radius, 0, Math.PI * 2);
    }
    context.fill();
  }

  private drawEnemies(context: CanvasRenderingContext2D, world: WorldRules) {
    context.fillStyle = world.enemyPlatforms ? '#ffbd4a' : '#ff6c7a';
    for (const enemy of this.enemies) {
      context.save();
      context.translate(enemy.x, enemy.y - 13);
      context.rotate(enemy.phase * 0.8);
      context.beginPath();
      context.moveTo(0, -enemy.radius);
      context.lineTo(enemy.radius, 0);
      context.lineTo(0, enemy.radius);
      context.lineTo(-enemy.radius, 0);
      context.closePath();
      context.fill();
      context.fillStyle = '#071217';
      context.fillRect(-3, -3, 6, 6);
      context.restore();
    }
  }

  private drawComets(context: CanvasRenderingContext2D) {
    if (this.comets.length === 0) return;
    context.strokeStyle = '#e4a7ff';
    context.lineWidth = 4;
    context.beginPath();
    for (const comet of this.comets) {
      context.moveTo(comet.x - 18, comet.y - 24);
      context.lineTo(comet.x, comet.y);
    }
    context.stroke();
    context.fillStyle = '#fff3db';
    context.beginPath();
    for (const comet of this.comets) {
      context.moveTo(comet.x + 7, comet.y);
      context.arc(comet.x, comet.y, 7, 0, Math.PI * 2);
    }
    context.fill();
  }

  private drawPlayer(context: CanvasRenderingContext2D) {
    context.save();
    context.translate(this.player.x, this.player.y);
    context.fillStyle = this.player.dashCooldown > 0 ? '#ffbd4a' : '#f7f3e8';
    context.beginPath();
    context.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#071217';
    context.fillRect(-5, -3, 10, 5);
    context.restore();
  }
}
