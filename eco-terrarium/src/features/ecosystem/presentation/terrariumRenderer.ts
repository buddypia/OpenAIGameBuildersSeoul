import {
  Organism,
  FoodPellet,
  SporeParticle,
  EnvironmentState,
  TerrariumCustomization,
  SpeciesInfo,
} from '../../../shared/kernel/types';
import { ConsumptionEffect, Shockwave } from '../domain/ecosystemEngine';
import {
  breathingScalar,
  radialPulseWave,
  travelingSpineWave,
} from '../domain/harmonicMotion';

interface SpeciesVariant {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSpeciesSeed(speciesId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < speciesId.length; i++) {
    h ^= speciesId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  organisms: Organism[];
  foodPellets: FoodPellet[];
  spores: SporeParticle[];
  shockwaves: Shockwave[];
  consumptionEffects: ConsumptionEffect[];
  env: EnvironmentState;
  customization: TerrariumCustomization;
  speciesMap: Map<string, SpeciesInfo>;
  selectedOrganismId: string | null;
  hoveredOrganismId: string | null;
  ecosystemHealth: number;
  time: number;
}

export class TerrariumRenderer {
  private ambientParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
  private speciesVariants = new Map<string, SpeciesVariant>();

  constructor() {
    // Generate 40 ambient floating bioluminescent motes
    for (let i = 0; i < 40; i++) {
      this.ambientParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  public render(rc: RenderContext) {
    const { ctx, canvas, env, customization, time } = rc;
    // The canvas is rendered at device resolution while the simulation stays in CSS pixels.
    const pixelRatio = ctx.getTransform().a || 1;
    const width = canvas.width / pixelRatio;
    const height = canvas.height / pixelRatio;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background Theme
    this.drawBackgroundTheme(ctx, width, height, customization.background, env);

    // The outer room/landscape is deliberately separate from the habitat. It gives the
    // translucent vessel something to refract, instead of leaving it floating on a flat fill.
    this.drawWorldBackdrop(ctx, width, height, customization.background, env, time);

    // 2. Draw God Rays & Sunlight
    this.drawSunlightRays(ctx, width, height, env.sunlight, time);

    // 3. Draw Terrarium Bottle Base & Glass Outline
    this.drawBottleShape(ctx, width, height, customization.bottleShape, 'back');

    // Everything living in the habitat is clipped to the glass. This preserves the illusion
    // on every vessel shape and lets foreground foliage overlap organisms naturally.
    ctx.save();
    this.traceBottlePath(ctx, width, height, customization.bottleShape);
    ctx.clip();

    // 3.5. Refracted light and the moving waterline establish a distinct water volume.
    this.drawWaterCaustics(ctx, width, height, env, time);
    this.drawWaterSurface(ctx, width, env, time);
    this.drawBiotopeLayer(ctx, width, height, customization.substrate, env, time, 'back');

    // 4. Draw Substrate / Soil / Floor
    this.drawSubstrate(ctx, width, height, customization.substrate, time);

    this.drawBiotopeLayer(ctx, width, height, customization.substrate, env, time, 'mid');
    this.drawAquaticGarden(ctx, width, height, customization.substrate, env, time);

    // 5. Draw Ambient Particles
    this.drawAmbientMotes(ctx, width, height, time);

    // 6. Draw Food & Nutrient Pellets
    this.drawFoodPellets(ctx, rc.foodPellets, time);

    // 7. Draw Spores
    this.drawSpores(ctx, rc.spores);

    // 8. Draw Organisms
    this.drawOrganisms(ctx, rc.organisms, rc.speciesMap, rc.selectedOrganismId, rc.hoveredOrganismId, time);

    // 9. Draw shockwaves from glass-tap interactions.
    this.drawShockwaves(ctx, rc.shockwaves);

    // Feeding gets its own bright, short-lived burst so successful interactions
    // remain readable even in a dense terrarium.
    this.drawConsumptionEffects(ctx, rc.consumptionEffects);

    // Close foliage makes the scene read as a small, layered habitat rather than a stage.
    this.drawBiotopeLayer(ctx, width, height, customization.substrate, env, time, 'front');

    // 10. Draw weather effects other than rain; moisture condensation is drawn
    // separately on the front glass.
    this.drawWeatherEffects(ctx, width, height, env, time);
    this.drawHealthAtmosphere(ctx, width, height, rc.ecosystemHealth, time);

    ctx.restore();

    // 11. Draw Front Glass Reflection & Highlights
    this.drawBottleShape(ctx, width, height, customization.bottleShape, 'front');
    this.drawGlassCondensation(ctx, width, height, customization.bottleShape, env, time);
  }

  private traceBottlePath(ctx: CanvasRenderingContext2D, w: number, h: number, shape: string) {
    const padX = 50;
    const padY = 40;
    const botW = w - padX * 2;
    const botH = h - padY * 2;

    ctx.beginPath();
    if (shape === 'geometric-dome') {
      ctx.moveTo(padX + botW * 0.1, h - padY);
      ctx.lineTo(padX + botW * 0.9, h - padY);
      ctx.lineTo(padX + botW, h - padY - botH * 0.4);
      ctx.lineTo(padX + botW * 0.75, padY + botH * 0.1);
      ctx.lineTo(padX + botW * 0.25, padY + botH * 0.1);
      ctx.lineTo(padX, h - padY - botH * 0.4);
      ctx.closePath();
    } else if (shape === 'antique-flask') {
      const neckW = botW * 0.25;
      ctx.moveTo(w / 2 - neckW / 2, padY);
      ctx.lineTo(w / 2 + neckW / 2, padY);
      ctx.lineTo(w / 2 + neckW / 2, padY + botH * 0.25);
      ctx.bezierCurveTo(padX + botW * 1.05, padY + botH * 0.35, padX + botW * 1.05, h - padY, w / 2, h - padY);
      ctx.bezierCurveTo(padX - botW * 0.05, h - padY, padX - botW * 0.05, padY + botH * 0.35, w / 2 - neckW / 2, padY + botH * 0.25);
      ctx.closePath();
    } else if (shape === 'crystal-sphere') {
      ctx.arc(w / 2, h / 2, Math.min(botW, botH) * 0.46, 0, Math.PI * 2);
    } else {
      const radius = 35;
      const topNeckW = botW * 0.55;
      ctx.moveTo(w / 2 - topNeckW / 2, padY + 15);
      ctx.lineTo(w / 2 + topNeckW / 2, padY + 15);
      ctx.quadraticCurveTo(padX + botW, padY + 30, padX + botW, padY + 70);
      ctx.lineTo(padX + botW, h - padY - radius);
      ctx.quadraticCurveTo(padX + botW, h - padY, padX + botW - radius, h - padY);
      ctx.lineTo(padX + radius, h - padY);
      ctx.quadraticCurveTo(padX, h - padY, padX, h - padY - radius);
      ctx.lineTo(padX, padY + 70);
      ctx.quadraticCurveTo(padX, padY + 30, w / 2 - topNeckW / 2, padY + 15);
      ctx.closePath();
    }
  }

  private drawBackgroundTheme(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    bg: string,
    env: EnvironmentState
  ) {
    const dayFactor = Math.sin(env.dayNightCycle * Math.PI * 2) * 0.5 + 0.5;

    let grad = ctx.createLinearGradient(0, 0, 0, h);
    if (bg === 'dawn-mist') {
      grad.addColorStop(0, `rgba(180, 210, 230, ${0.4 + dayFactor * 0.4})`);
      grad.addColorStop(0.5, `rgba(140, 180, 190, ${0.3 + dayFactor * 0.3})`);
      grad.addColorStop(1, '#0b1920');
    } else if (bg === 'sunset-window') {
      grad.addColorStop(0, `rgba(255, 140, 90, ${0.3 + dayFactor * 0.5})`);
      grad.addColorStop(0.6, `rgba(180, 70, 110, ${0.3 + dayFactor * 0.3})`);
      grad.addColorStop(1, '#110b1a');
    } else if (bg === 'cosmic-aurora') {
      grad.addColorStop(0, '#0a0d24');
      grad.addColorStop(0.5, '#0d1f2d');
      grad.addColorStop(1, '#05070e');
    } else {
      // cozy-lab
      grad.addColorStop(0, '#101c26');
      grad.addColorStop(0.5, '#0b141d');
      grad.addColorStop(1, '#060a0e');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // A soft vignette keeps attention inside the vessel without making the scene flat.
    const vignette = ctx.createRadialGradient(w / 2, h * 0.44, h * 0.12, w / 2, h * 0.48, Math.max(w, h) * 0.72);
    vignette.addColorStop(0, 'rgba(255,255,255,0.025)');
    vignette.addColorStop(0.68, 'rgba(2, 8, 14, 0.03)');
    vignette.addColorStop(1, 'rgba(1, 5, 10, 0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Cosmic stars if night or cosmic theme
    if (bg === 'cosmic-aurora' || dayFactor < 0.4) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 30; i++) {
        const sx = (Math.sin(i * 99 + 1) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 37 + 2) * 0.5 + 0.5) * (h * 0.7);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }
  }

  private drawWorldBackdrop(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    bg: string,
    env: EnvironmentState,
    time: number
  ) {
    ctx.save();
    const day = Math.sin(env.dayNightCycle * Math.PI * 2) * 0.5 + 0.5;

    if (bg === 'cozy-lab') {
      // Faint architectural lines make the lab feel like a real place beyond the glass.
      ctx.strokeStyle = `rgba(222, 184, 135, ${0.06 + day * 0.08})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.1, h * 0.08, w * 0.8, h * 0.78);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.08);
      ctx.lineTo(w * 0.5, h * 0.86);
      ctx.moveTo(w * 0.1, h * 0.42);
      ctx.lineTo(w * 0.9, h * 0.42);
      ctx.stroke();
      const lamp = ctx.createRadialGradient(w * 0.78, h * 0.16, 0, w * 0.78, h * 0.16, w * 0.3);
      lamp.addColorStop(0, `rgba(255, 218, 135, ${0.16 + day * 0.16})`);
      lamp.addColorStop(1, 'rgba(255, 194, 105, 0)');
      ctx.fillStyle = lamp;
      ctx.fillRect(0, 0, w, h);
    } else if (bg === 'dawn-mist') {
      for (let i = 0; i < 4; i++) {
        const y = h * (0.46 + i * 0.09);
        ctx.fillStyle = `rgba(53, 94, 83, ${0.09 - i * 0.012})`;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 24) {
          ctx.lineTo(x, y + Math.sin(x * 0.017 + i * 2.4) * 18);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
    } else if (bg === 'sunset-window') {
      const sunX = w * (0.22 + day * 0.52);
      const halo = ctx.createRadialGradient(sunX, h * 0.28, 0, sunX, h * 0.28, w * 0.22);
      halo.addColorStop(0, 'rgba(255, 238, 180, 0.32)');
      halo.addColorStop(0.35, 'rgba(255, 160, 93, 0.13)');
      halo.addColorStop(1, 'rgba(255, 120, 70, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255, 225, 190, 0.075)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.16, 0);
      ctx.lineTo(w * 0.16, h);
      ctx.moveTo(w * 0.84, 0);
      ctx.lineTo(w * 0.84, h);
      ctx.stroke();
    } else {
      // A second, slow aurora ribbon gives the cosmic theme a clear sense of movement.
      ctx.globalCompositeOperation = 'screen';
      for (let band = 0; band < 3; band++) {
        const startY = h * (0.18 + band * 0.11);
        const bandGradient = ctx.createLinearGradient(0, startY, w, startY + h * 0.16);
        bandGradient.addColorStop(0, 'rgba(34, 211, 238, 0)');
        bandGradient.addColorStop(0.45, `rgba(${band === 1 ? '192, 132, 252' : '45, 212, 191'}, ${0.1 + day * 0.05})`);
        bandGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.strokeStyle = bandGradient;
        ctx.lineWidth = 16;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 16) {
          const y = startY + Math.sin(x * 0.012 + time * 0.32 + band * 1.7) * 18;
          if (x < 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawWaterSurface(ctx: CanvasRenderingContext2D, w: number, env: EnvironmentState, time: number) {
    const waterY = 72 + (100 - env.moisture) * 0.13;
    ctx.save();
    const waterGradient = ctx.createLinearGradient(0, waterY, 0, waterY + 18);
    waterGradient.addColorStop(0, `rgba(209, 250, 229, ${0.2 + env.moisture * 0.002})`);
    waterGradient.addColorStop(1, 'rgba(72, 190, 180, 0)');
    ctx.fillStyle = waterGradient;
    ctx.beginPath();
    ctx.moveTo(48, waterY);
    for (let x = 48; x <= w - 48; x += 10) {
      ctx.lineTo(x, waterY + Math.sin(x * 0.055 + time * 2.2) * 2.2 + Math.sin(x * 0.12 - time) * 0.7);
    }
    ctx.lineTo(w - 48, waterY + 18);
    ctx.lineTo(48, waterY + 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(240, 253, 250, ${0.18 + env.sunlight * 0.002})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  private drawBiotopeLayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    substrate: string,
    env: EnvironmentState,
    time: number,
    layer: 'back' | 'mid' | 'front'
  ) {
    const floorY = h - 75;
    const isWater = substrate === 'deep-sea-sand';
    const tint = substrate === 'volcanic-obsidian' ? [251, 113, 22]
      : substrate === 'crystal-cave' ? [196, 181, 253]
      : isWater ? [103, 232, 249] : [110, 231, 145];
    const density = 0.55 + env.moisture / 200;
    const count = layer === 'back' ? 8 : layer === 'mid' ? 6 : 7;
    const yOffset = layer === 'back' ? 0 : layer === 'mid' ? 9 : 18;
    const alpha = layer === 'back' ? 0.24 : layer === 'mid' ? 0.42 : 0.64;
    const habitatLeft = 70;
    const habitatWidth = Math.max(1, w - habitatLeft * 2);
    const layerOffset = layer === 'front' ? 0.5 : layer === 'mid' ? 0.22 : 0.76;

    ctx.save();
    for (let i = 0; i < count; i++) {
      // Evenly cover the bottle floor at every canvas width. The prior fixed
      // 97px spacing left the right half empty on wide displays.
      const x = habitatLeft + ((i + layerOffset) / count) * habitatWidth;
      const baseY = floorY + yOffset + ((i * 13) % 16);
      const height = (isWater ? 44 : 30) * density + (i % 3) * 7;
      const sway = Math.sin(time * (isWater ? 1.7 : 1.05) + i * 1.9) * (isWater ? 8 : 4);

      if (substrate === 'crystal-cave') {
        ctx.fillStyle = `rgba(${tint.join(',')}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + sway * 0.2, baseY - height);
        ctx.lineTo(x + 9, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.55})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (substrate === 'volcanic-obsidian') {
        ctx.strokeStyle = `rgba(${tint.join(',')}, ${alpha * 0.8})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x + sway, baseY - height * 0.55, x + sway * 0.5, baseY - height);
        ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(${tint.join(',')}, ${alpha})`;
        ctx.lineWidth = isWater ? 2 : 2.6;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x + sway, baseY - height * 0.55, x + sway * 0.45, baseY - height);
        ctx.stroke();
        for (let leaf = 0; leaf < 2; leaf++) {
          const leafY = baseY - height * (0.42 + leaf * 0.25);
          ctx.fillStyle = `rgba(${tint.join(',')}, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.ellipse(x + sway * (0.2 + leaf * 0.1), leafY, isWater ? 3 : 5, isWater ? 11 : 7, sway * 0.06, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  /**
   * A sparse, environment-responsive kelp garden makes moisture feel like a
   * living medium instead of a slider. It stays behind organisms, so the new
   * habitat detail improves depth without obscuring inspection targets.
   */
  private drawAquaticGarden(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    substrate: string,
    env: EnvironmentState,
    time: number
  ) {
    if (env.moisture < 45) return;

    const floorY = h - 76;
    const moistureStrength = Math.min(1, (env.moisture - 45) / 55);
    const isDeepSea = substrate === 'deep-sea-sand';
    const stalkCount = 3 + Math.floor(moistureStrength * 4) + (isDeepSea ? 2 : 0);
    const left = 82;
    const usableWidth = Math.max(1, w - left * 2);
    const kelpColor = isDeepSea ? '100, 232, 222' : '99, 204, 147';

    ctx.save();
    ctx.lineCap = 'round';

    for (let index = 0; index < stalkCount; index++) {
      const x = left + ((index + 0.36) / stalkCount) * usableWidth;
      const height = 42 + moistureStrength * 50 + (index % 3) * 13;
      const phase = time * (1.25 + (index % 3) * 0.12) + index * 1.73;
      const sway = Math.sin(phase) * (5 + moistureStrength * 8);
      const tipX = x + sway;
      const tipY = floorY - height;

      // Anchor each plant with two quiet stones; these give the garden a
      // believable root without becoming visual noise at small viewports.
      ctx.fillStyle = 'rgba(158, 190, 174, 0.16)';
      ctx.beginPath();
      ctx.ellipse(x - 4, floorY + 1, 6, 2.5, -0.15, 0, Math.PI * 2);
      ctx.ellipse(x + 5, floorY + 2, 4.5, 2, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${kelpColor}, ${0.26 + moistureStrength * 0.28})`;
      ctx.lineWidth = 1.6 + moistureStrength * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.bezierCurveTo(x - sway * 0.2, floorY - height * 0.35, x + sway * 0.72, floorY - height * 0.72, tipX, tipY);
      ctx.stroke();

      for (let frond = 0; frond < 3; frond++) {
        const progress = 0.3 + frond * 0.22;
        const stemX = x + sway * progress * 0.85;
        const stemY = floorY - height * progress;
        const direction = frond % 2 === 0 ? -1 : 1;
        const frondLength = 9 + moistureStrength * 10 + (index % 2) * 2;
        ctx.fillStyle = `rgba(${kelpColor}, ${0.2 + moistureStrength * 0.34})`;
        ctx.beginPath();
        ctx.moveTo(stemX, stemY);
        ctx.quadraticCurveTo(
          stemX + direction * frondLength * 0.55 + sway * 0.18,
          stemY - frondLength * 0.52,
          stemX + direction * frondLength + sway * 0.24,
          stemY - frondLength * 0.15
        );
        ctx.quadraticCurveTo(stemX + direction * frondLength * 0.46, stemY + 3, stemX, stemY);
        ctx.fill();
      }
    }

    // Slow bubbles and a faint cross-current are deliberate navigation cues:
    // at high moisture players can see why swimming motion becomes more active.
    if (env.moisture >= 65) {
      const bubbleCount = 4 + Math.floor(moistureStrength * 6);
      ctx.strokeStyle = `rgba(212, 250, 244, ${0.14 + moistureStrength * 0.18})`;
      ctx.lineWidth = 1;
      for (let index = 0; index < bubbleCount; index++) {
        const x = 76 + ((index * 89.3 + time * (7 + index % 3)) % Math.max(1, w - 152));
        const rise = (time * (15 + (index % 4) * 3) + index * 37) % Math.max(1, h * 0.5);
        const y = floorY - 10 - rise;
        const radius = 1.5 + (index % 3) * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawGlassCondensation(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    shape: string,
    env: EnvironmentState,
    time: number
  ) {
    if (env.moisture < 38) return;
    ctx.save();
    this.traceBottlePath(ctx, w, h, shape);
    ctx.clip();
    const count = Math.floor(8 + (env.moisture - 38) * 0.38);
    ctx.fillStyle = `rgba(226, 248, 255, ${0.08 + env.moisture * 0.0013})`;
    for (let i = 0; i < count; i++) {
      const x = 68 + ((i * 67.3) % Math.max(1, w - 136));
      const y = 68 + ((i * 43.7 + time * (i % 3 === 0 ? 6 : 1.2)) % Math.max(1, h - 170));
      const r = 0.8 + (i % 4) * 0.45;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.65, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawWaterCaustics(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    env: EnvironmentState,
    time: number
  ) {
    if (env.sunlight < 12) return;

    const intensity = (env.sunlight / 100) * 0.12;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = `rgba(180, 247, 255, ${intensity})`;
    ctx.lineWidth = 1.25;
    for (let row = 0; row < 5; row++) {
      const y = h * (0.2 + row * 0.115);
      ctx.beginPath();
      for (let x = 72; x < w - 70; x += 12) {
        const wave = Math.sin(x * 0.034 + time * 1.4 + row) * 5
          + Math.sin(x * 0.08 - time * 0.8 + row * 1.8) * 2;
        if (x === 72) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSunlightRays(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sunlight: number,
    time: number
  ) {
    if (sunlight < 15) return;
    const rayCount = 5;
    const alpha = (sunlight / 100) * 0.18;

    ctx.save();
    for (let i = 0; i < rayCount; i++) {
      const offset = (i - rayCount / 2) * 120 + Math.sin(time * 0.5 + i) * 30;
      const grad = ctx.createLinearGradient(w / 2 + offset, 0, w / 2 + offset * 1.8, h);
      grad.addColorStop(0, `rgba(255, 245, 180, ${alpha * 1.5})`);
      grad.addColorStop(0.7, `rgba(255, 220, 120, ${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(255, 200, 100, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(w / 2 + offset - 25, 0);
      ctx.lineTo(w / 2 + offset + 25, 0);
      ctx.lineTo(w / 2 + offset * 2.2 + 80, h);
      ctx.lineTo(w / 2 + offset * 2.2 - 80, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBottleShape(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    shape: string,
    layer: 'back' | 'front'
  ) {
    const padX = 50;
    const padY = 40;
    const botH = h - padY * 2;

    ctx.save();
    this.traceBottlePath(ctx, w, h, shape);

    if (layer === 'back') {
      // Bottle interior ambient tint
      const water = ctx.createLinearGradient(0, padY, 0, h - padY);
      water.addColorStop(0, 'rgba(105, 210, 218, 0.09)');
      water.addColorStop(0.58, 'rgba(15, 67, 77, 0.16)');
      water.addColorStop(1, 'rgba(5, 19, 24, 0.43)');
      ctx.fillStyle = water;
      ctx.fill();
    } else {
      // Glass border and rim highlights
      ctx.strokeStyle = 'rgba(218, 250, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // A fine inner edge makes the glass feel thick rather than outlined.
      ctx.strokeStyle = 'rgba(18, 75, 91, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Specular highlight stripe
      ctx.beginPath();
      ctx.ellipse(padX + 25, h / 2, 8, botH * 0.35, -0.08, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();

      const rim = ctx.createLinearGradient(w * 0.28, 0, w * 0.72, 0);
      rim.addColorStop(0, 'rgba(255,255,255,0)');
      rim.addColorStop(0.45, 'rgba(242, 254, 255, 0.55)');
      rim.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = rim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, padY + 15);
      ctx.quadraticCurveTo(w * 0.5, padY + 7, w * 0.7, padY + 15);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawSubstrate(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    substrate: string,
    time: number
  ) {
    const floorY = h - 75;
    ctx.save();

    if (substrate === 'volcanic-obsidian') {
      const grad = ctx.createLinearGradient(0, floorY, 0, h);
      grad.addColorStop(0, '#2d1810');
      grad.addColorStop(1, '#0d0705');
      ctx.fillStyle = grad;
      ctx.fillRect(50, floorY, w - 100, 75);

      // Magma fissures
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, floorY + 10);
      ctx.lineTo(140, floorY + 25);
      ctx.lineTo(220, floorY + 15);
      ctx.stroke();
    } else if (substrate === 'crystal-cave') {
      const grad = ctx.createLinearGradient(0, floorY, 0, h);
      grad.addColorStop(0, '#2e1065');
      grad.addColorStop(1, '#090314');
      ctx.fillStyle = grad;
      ctx.fillRect(50, floorY, w - 100, 75);

      // Crystal spires
      ctx.fillStyle = 'rgba(192, 132, 252, 0.8)';
      for (let i = 0; i < 8; i++) {
        const cx = 90 + i * 85;
        const cy = floorY + 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 8, cy + 25);
        ctx.lineTo(cx + 8, cy + 25);
        ctx.closePath();
        ctx.fill();
      }
    } else if (substrate === 'deep-sea-sand') {
      const grad = ctx.createLinearGradient(0, floorY, 0, h);
      grad.addColorStop(0, '#0e3a47');
      grad.addColorStop(1, '#051820');
      ctx.fillStyle = grad;
      ctx.fillRect(50, floorY, w - 100, 75);

      // Layered tidal ripples prevent the sand from reading as a flat strip.
      for (let y = floorY + 14; y < h - 10; y += 14) {
        ctx.beginPath();
        for (let x = 60; x < w - 60; x += 10) {
          const wave = Math.sin(x * 0.055 + y * 0.12 + time * 1.1) * 2;
          if (x === 60) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      // moss-forest (default)
      const grad = ctx.createLinearGradient(0, floorY, 0, h);
      grad.addColorStop(0, '#1b3b22');
      grad.addColorStop(0.4, '#142c19');
      grad.addColorStop(1, '#08140a');
      ctx.fillStyle = grad;
      ctx.fillRect(50, floorY, w - 100, 75);

      // Wavy soft moss mounds
      ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
      ctx.beginPath();
      ctx.moveTo(50, floorY + 15);
      for (let x = 50; x <= w - 50; x += 30) {
        const wave = Math.sin(x * 0.08 + time * 1.5) * 4;
        ctx.lineTo(x, floorY + wave + 5);
      }
      ctx.lineTo(w - 50, floorY + 25);
      ctx.lineTo(50, floorY + 25);
      ctx.closePath();
      ctx.fill();
    }

    // Small pebbles and embedded specks create a shared physical floor across themes.
    for (let i = 0; i < 24; i++) {
      const px = 62 + ((i * 71.3) % (w - 124));
      const py = floorY + 30 + ((i * 29.7) % 36);
      const radius = 1.5 + (i % 4) * 0.75;
      ctx.fillStyle = `rgba(226, 244, 233, ${0.08 + (i % 3) * 0.035})`;
      ctx.beginPath();
      ctx.ellipse(px, py, radius * 1.5, radius, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawAmbientMotes(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number
  ) {
    ctx.save();
    for (const mote of this.ambientParticles) {
      mote.x += mote.vx;
      mote.y += mote.vy;
      if (mote.y < 50) mote.y = h - 60;
      if (mote.x < 60) mote.x = w - 70;
      if (mote.x > w - 60) mote.x = 70;

      const pulse = Math.sin(time * 2 + mote.x) * 0.2 + 0.8;
      const halo = ctx.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, mote.size * 5);
      halo.addColorStop(0, `rgba(198, 255, 231, ${mote.alpha * pulse * 0.32})`);
      halo.addColorStop(1, 'rgba(167, 243, 208, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(167, 243, 208, ${mote.alpha * pulse})`;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawFoodPellets(ctx: CanvasRenderingContext2D, pellets: FoodPellet[], time: number) {
    ctx.save();
    for (const p of pellets) {
      if (p.type === 'mutagen') {
        const pulse = Math.sin(time * 6) * 3 + p.radius;
        const orb = ctx.createRadialGradient(p.x - p.radius * 0.3, p.y - p.radius * 0.3, 0, p.x, p.y, p.radius);
        orb.addColorStop(0, '#fdf4ff');
        orb.addColorStop(0.45, '#e879f9');
        orb.addColorStop(1, '#a21caf');
        ctx.fillStyle = orb;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.35 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
        ctx.stroke();

        // Tilted orbiting spark implies the mutagen is unstable.
        const oa = time * 3.2;
        ctx.fillStyle = 'rgba(240, 171, 252, 0.9)';
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(oa) * p.radius * 1.9, p.y + Math.sin(oa) * p.radius * 0.7, 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'carcass') {
        // A deflated remains-blob with X eyes reads as "this was a creature".
        const wobble = Math.sin(time * 1.5 + p.x) * 0.2;
        const remains = ctx.createRadialGradient(p.x - p.radius * 0.3, p.y - p.radius * 0.3, 0, p.x, p.y, p.radius);
        remains.addColorStop(0, 'rgba(216, 180, 254, 0.9)');
        remains.addColorStop(1, 'rgba(107, 33, 168, 0.85)');
        ctx.fillStyle = remains;
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 1.15, p.radius * 0.85, wobble, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        const er = Math.max(1.4, p.radius * 0.26);
        ctx.strokeStyle = 'rgba(59, 7, 100, 0.8)';
        ctx.lineWidth = 1;
        for (const dx of [-0.38, 0.38]) {
          const cxp = p.x + p.radius * dx;
          const cyp = p.y - p.radius * 0.08;
          ctx.beginPath();
          ctx.moveTo(cxp - er, cyp - er);
          ctx.lineTo(cxp + er, cyp + er);
          ctx.moveTo(cxp + er, cyp - er);
          ctx.lineTo(cxp - er, cyp + er);
          ctx.stroke();
        }
      } else {
        // nutrient
        const nutrient = ctx.createRadialGradient(p.x - p.radius * 0.3, p.y - p.radius * 0.35, 0, p.x, p.y, p.radius);
        nutrient.addColorStop(0, '#dcfce7');
        nutrient.addColorStop(0.42, '#86efac');
        nutrient.addColorStop(1, '#16a34a');
        ctx.fillStyle = nutrient;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.arc(p.x - p.radius * 0.28, p.y - p.radius * 0.3, Math.max(1.2, p.radius * 0.17), 0, Math.PI * 2);
        ctx.fill();

        // Faint halo ring separates pellets from organisms at a glance.
        ctx.strokeStyle = `rgba(134, 239, 172, ${0.22 + Math.sin(time * 3 + p.x) * 0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawSpores(ctx: CanvasRenderingContext2D, spores: SporeParticle[]) {
    ctx.save();
    for (let i = 0; i < spores.length; i++) {
      const sp = spores[i];
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Alternating four-point glints keep dense spore clouds from looking flat.
      if (i % 2 === 0) {
        const g = 4.2;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sp.x - g, sp.y);
        ctx.lineTo(sp.x + g, sp.y);
        ctx.moveTo(sp.x, sp.y - g);
        ctx.lineTo(sp.x, sp.y + g);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private getVariant(speciesId: string): SpeciesVariant {
    let v = this.speciesVariants.get(speciesId);
    if (!v) {
      const rng = mulberry32(hashSpeciesSeed(speciesId));
      v = { a: rng(), b: rng(), c: rng(), d: rng(), e: rng() };
      this.speciesVariants.set(speciesId, v);
    }
    return v;
  }

  private drawOrganisms(
    ctx: CanvasRenderingContext2D,
    organisms: Organism[],
    speciesMap: Map<string, SpeciesInfo>,
    selectedId: string | null,
    hoveredId: string | null,
    time: number
  ) {
    ctx.save();
    // Beyond this population the micro details drop out before silhouettes do.
    const highDetail = organisms.length <= 55;

    for (const org of organisms) {
      const sp = speciesMap.get(org.speciesId);
      const isSelected = org.id === selectedId;
      const isHovered = org.id === hoveredId;
      const r = org.sizePx;

      // Contact shadow anchors every creature to the habitat floor.
      const shadowY = org.y + r * 0.95;
      if (highDetail) {
        const shadow = ctx.createRadialGradient(org.x, shadowY, 0, org.x, shadowY, r * 0.95);
        shadow.addColorStop(0, 'rgba(1, 8, 12, 0.26)');
        shadow.addColorStop(1, 'rgba(1, 8, 12, 0)');
        ctx.fillStyle = shadow;
      } else {
        ctx.fillStyle = 'rgba(1, 8, 12, 0.15)';
      }
      ctx.beginPath();
      ctx.ellipse(org.x, shadowY, r * 0.95, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(org.x, org.y);

      // Sessile creatures stay rooted upright with a gentle sway; swimmers keep heading.
      if (org.trophicLevel === 'producer' || org.trophicLevel === 'decomposer') {
        ctx.rotate(Math.sin(time * 0.9 + org.pulsePhase) * 0.07);
        const rootedSquish = Math.sin(org.pulsePhase) * 0.08;
        ctx.scale(1 + rootedSquish, 1 - rootedSquish);
      } else {
        ctx.rotate(org.angle);
        const squish = Math.sin(org.pulsePhase) * 0.12;
        ctx.scale(1 + squish, 1 - squish);
      }

      // Glow effect
      const glowColor = sp?.glowColor || `hsl(${org.genome.hue}, 80%, 65%)`;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = (org.genome.bioluminescence || 0.7) * 16;

      this.drawCreatureShape(ctx, org, time, highDetail);

      // Highlight Reticle if selected or hovered
      if (isSelected || isHovered) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -time * 14;
        ctx.beginPath();
        ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private drawCreatureShape(
    ctx: CanvasRenderingContext2D,
    org: Organism,
    time: number,
    highDetail = true
  ) {
    const r = org.sizePx;
    const hue = org.genome.hue;
    const lightColor = `hsla(${hue}, 95%, 82%, 0.88)`;
    const v = this.getVariant(org.speciesId);

    // Non-linear time scaling: sin(t)³ builds inhale/exhale easing into the formula
    // itself, so every creature breathes without a hand-authored keyframe.
    const breath = breathingScalar(time * 0.9, org.pulsePhase);

    if (org.trophicLevel === 'producer') {
      const petals = 5 + Math.floor(v.a * 3); // 5-7, unique per species
      const petalLen = r * (0.72 + v.b * 0.18);
      const petalW = r * (0.36 + v.c * 0.1);
      const rosetteSpin = time * 0.22 + v.d * Math.PI * 2;

      // Stem: two-pass tapered stroke with a gentle breeze sway.
      const sway = Math.sin(time * 0.85 + org.pulsePhase) * r * 0.07;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `hsla(${hue + 8}, 60%, 26%, 0.9)`;
      ctx.lineWidth = Math.max(1.6, r * 0.14);
      ctx.beginPath();
      ctx.moveTo(-r * 0.08, r * 1.55);
      ctx.quadraticCurveTo(-r * 0.28 + sway, r * 0.9, -r * 0.05 + sway * 0.5, r * 0.3);
      ctx.stroke();
      ctx.strokeStyle = `hsla(${hue + 12}, 70%, 44%, 0.55)`;
      ctx.lineWidth = Math.max(0.6, r * 0.05);
      ctx.beginPath();
      ctx.moveTo(-r * 0.08, r * 1.5);
      ctx.quadraticCurveTo(-r * 0.28 + sway, r * 0.9, -r * 0.05 + sway * 0.5, r * 0.32);
      ctx.stroke();

      // Back foliage layer (darker, larger) gives the rosette depth.
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 - Math.PI / 2 + rosetteSpin * 0.6;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(r * 0.3, 0);
        ctx.fillStyle = `hsla(${hue + 16}, 62%, 27%, 0.78)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(petalLen * 0.5, -petalW * 1.15, petalLen * 1.18, 0);
        ctx.quadraticCurveTo(petalLen * 0.5, petalW * 1.15, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Front petals ride the unfurl wave so the rosette opens like a living bloom.
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 - Math.PI / 2 + rosetteSpin;
        const unfurl =
          1 + radialPulseWave(i * 0.6, time, { frequency: 1.6, waveNumber: 1.1, damping: 0.12 }) * 0.14;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(r * 0.22, 0);
        ctx.fillStyle = `hsla(${hue + i * 4}, 82%, ${58 + (i % 2) * 8}%, 0.85)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(petalLen * 0.45 * unfurl, -petalW, petalLen * unfurl, 0);
        ctx.quadraticCurveTo(petalLen * 0.45 * unfurl, petalW * (1 + breath * 0.12), 0, 0);
        ctx.closePath();
        ctx.fill();
        if (highDetail) {
          ctx.strokeStyle = `hsla(${hue + 30}, 90%, 88%, 0.35)`;
          ctx.lineWidth = Math.max(0.5, r * 0.045);
          ctx.beginPath();
          ctx.moveTo(petalLen * 0.12, 0);
          ctx.quadraticCurveTo(petalLen * 0.5 * unfurl, -petalW * 0.18, petalLen * 0.86 * unfurl, 0);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Central bulb with off-center lighting and a pulsing nectar core.
      const bulb = ctx.createRadialGradient(-r * 0.16, -r * 0.2, r * 0.04, 0, 0, r * 0.56);
      bulb.addColorStop(0, `hsla(${hue + 18}, 96%, 86%, 0.98)`);
      bulb.addColorStop(0.55, `hsla(${hue + 4}, 84%, 60%, 0.94)`);
      bulb.addColorStop(1, `hsla(${hue - 6}, 76%, 33%, 0.92)`);
      ctx.fillStyle = bulb;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue + 34}, 95%, 90%, ${0.32 + breath * 0.14})`;
      ctx.lineWidth = Math.max(0.7, r * 0.06);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, -Math.PI * 0.9, -Math.PI * 0.1);
      ctx.stroke();

      const coreR = r * (0.15 + Math.max(0, breath) * 0.05);
      const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 2.4);
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGlow.addColorStop(0.4, `hsla(${hue + 40}, 100%, 88%, 0.5)`);
      coreGlow.addColorStop(1, `hsla(${hue + 40}, 100%, 88%, 0)`);
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting pollen sparkles sell the "alive" feeling.
      if (highDetail) {
        for (let i = 0; i < 3; i++) {
          const pa = time * (0.7 + i * 0.23) + v.e * Math.PI * 2 + i * 2.1;
          const pr = r * (0.95 + i * 0.16);
          const twinkle = 0.4 + Math.sin(time * 3 + i * 2.4) * 0.3;
          ctx.fillStyle = `rgba(255, 255, 240, ${twinkle})`;
          ctx.beginPath();
          ctx.arc(Math.cos(pa) * pr, Math.sin(pa) * pr * 0.8, r * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (org.trophicLevel === 'herbivore') {
      const tentacles = 4 + Math.floor(v.a * 3); // 4-6 per species
      const flutter = Math.sin(time * 2.6 + org.pulsePhase);

      // Trailing tentacles: tapered strands with a phase-delayed travelling wave.
      ctx.lineCap = 'round';
      const tailSegments = 6;
      for (let i = 0; i < tentacles; i++) {
        const spread = tentacles > 1 ? (i / (tentacles - 1) - 0.5) * 2 : 0;
        let px = spread * r * 0.55;
        let py = r * 0.1;
        for (let s = 1; s <= tailSegments; s++) {
          const progress = s / tailSegments;
          const wave =
            radialPulseWave(progress * 2.4, time * 2 + org.pulsePhase + i * 0.85, {
              frequency: 7,
              waveNumber: 1.9,
              damping: 0.16,
            }) *
            r *
            0.5 *
            progress;
          const nx = px - r * (0.16 + progress * 0.34) * (1 + flutter * 0.03);
          const ny = py + r * (0.05 + progress * 0.16) + wave;
          ctx.strokeStyle = `hsla(${hue + 8}, 88%, ${74 - s * 3}%, ${0.75 - progress * 0.35})`;
          ctx.lineWidth = Math.max(0.6, r * 0.14 * (1 - progress * 0.8));
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          px = nx;
          py = ny;
        }
      }

      // Bell: a proper medusa dome with a scalloped skirt instead of a bare circle.
      const bellH = r * 1.18;
      const bell = ctx.createLinearGradient(0, -bellH, 0, r * 0.2);
      bell.addColorStop(0, `hsla(${hue}, 92%, 84%, 0.97)`);
      bell.addColorStop(0.45, `hsla(${hue}, 86%, 66%, 0.92)`);
      bell.addColorStop(1, `hsla(${hue + 12}, 78%, 44%, 0.9)`);
      ctx.fillStyle = bell;
      ctx.beginPath();
      ctx.moveTo(-r * 0.98, r * 0.05);
      ctx.bezierCurveTo(-r * 1.02, -bellH, r * 1.02, -bellH, r * 0.98, r * 0.05);
      const scallops = 4;
      for (let i = 0; i < scallops; i++) {
        const x0 = r * 0.98 * (1 - (2 * i) / scallops);
        const x1 = r * 0.98 * (1 - (2 * (i + 1)) / scallops);
        const dip = r * (0.14 + flutter * 0.02);
        ctx.quadraticCurveTo((x0 + x1) / 2, r * 0.05 + dip, x1, r * 0.05);
      }
      ctx.closePath();
      ctx.fill();

      // Soft inner glow organ visible through the translucent bell.
      const organs = ctx.createRadialGradient(-r * 0.1, -r * 0.25, 0, 0, -r * 0.1, r * 0.62);
      organs.addColorStop(0, `hsla(${hue + 22}, 95%, 90%, 0.5)`);
      organs.addColorStop(1, `hsla(${hue + 22}, 95%, 90%, 0)`);
      ctx.fillStyle = organs;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.62, 0, Math.PI * 2);
      ctx.fill();

      // Gonad dots arched across the dome crown, like a real medusa.
      for (let i = 0; i < 4; i++) {
        const gx = (i - 1.5) * r * 0.3;
        const gy = -r * (0.52 - Math.abs(i - 1.5) * 0.12);
        ctx.fillStyle = `hsla(${hue + 30}, 90%, 86%, 0.38)`;
        ctx.beginPath();
        ctx.arc(gx, gy, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }

      // Medusa bell contraction: a radially damped pulse ring travelling outward.
      const bellPulse = radialPulseWave(0.35, time * 2, {
        frequency: 3.4,
        waveNumber: 1.6,
        damping: 0.2,
      });
      ctx.strokeStyle = `hsla(${hue + 15}, 95%, 90%, ${0.14 + Math.abs(bellPulse) * 0.26})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -bellH * 0.34, r * (0.72 + bellPulse * 0.1), bellH * (0.5 + bellPulse * 0.06), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Crown rim light keeps the dome reading as wet glass.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.beginPath();
      ctx.ellipse(0, -bellH * 0.28, r * 0.6, bellH * 0.5, 0, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // One kawaii side-profile eye with an occasional blink.
      const eyeX = r * 0.38;
      const eyeY = -r * 0.34;
      const eyeR = r * 0.17;
      const rawBlink = (Math.sin(time * 1.6 + org.pulsePhase) + 1) / 2;
      const openness = Math.min(1, Math.max(0.08, rawBlink * 12));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, eyeR, eyeR * openness, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#101828';
      ctx.beginPath();
      ctx.ellipse(eyeX + eyeR * 0.28, eyeY, eyeR * 0.52, eyeR * 0.62 * openness, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(eyeX + eyeR * 0.42, eyeY - eyeR * 0.3 * openness, Math.max(0.6, eyeR * 0.2), 0, Math.PI * 2);
      ctx.fill();

      // Blush + tiny smile keep the healing-game charm.
      ctx.fillStyle = `hsla(${hue + 45}, 90%, 75%, 0.26)`;
      ctx.beginPath();
      ctx.ellipse(eyeX - r * 0.12, eyeY + r * 0.34, r * 0.12, r * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 24, 40, 0.65)';
      ctx.lineWidth = Math.max(0.7, r * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(eyeX + r * 0.02, eyeY + r * 0.28, r * 0.16, 0.35, Math.PI - 0.7);
      ctx.stroke();

      // Genome defense is reflected as visible membranes rather than only an inspector stat.
      if (org.genome.defense > 0.45) {
        ctx.strokeStyle = `hsla(${hue + 35}, 85%, 92%, ${0.22 + org.genome.defense * 0.3})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.1, r * 1.12, bellH * 0.98, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
      }
    } else if (org.trophicLevel === 'predator') {
      const swim = time + org.pulsePhase;

      // Forked caudal fin driven by the spine wave — two lobes, upper longer.
      const tailSwing = travelingSpineWave(0.9, swim, 3.2, 7).offset * r * 0.42;
      ctx.fillStyle = `hsla(${hue - 10}, 68%, 30%, 0.82)`;
      ctx.beginPath();
      ctx.moveTo(-r * 0.82, 0);
      ctx.quadraticCurveTo(-r * 1.25, -r * 0.3 + tailSwing, -r * 1.72, -r * 0.92 + tailSwing);
      ctx.quadraticCurveTo(-r * 1.28, -r * 0.18 + tailSwing * 0.6, -r * 1.18, tailSwing * 0.3);
      ctx.quadraticCurveTo(-r * 1.28, r * 0.18 + tailSwing * 0.6, -r * 1.6, r * 0.78 + tailSwing);
      ctx.quadraticCurveTo(-r * 1.2, r * 0.26 + tailSwing, -r * 0.82, 0);
      ctx.closePath();
      ctx.fill();
      if (highDetail) {
        ctx.strokeStyle = `hsla(${hue + 14}, 80%, 72%, 0.3)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-r * 0.95, -r * 0.05);
        ctx.lineTo(-r * 1.55, -r * 0.7 + tailSwing);
        ctx.moveTo(-r * 0.95, r * 0.05);
        ctx.lineTo(-r * 1.45, r * 0.62 + tailSwing);
        ctx.stroke();
      }

      // Dorsal sail with a slow ripple; height varies per species.
      const dorsalSway = Math.sin(time * 2.2 + org.pulsePhase) * r * 0.06;
      ctx.fillStyle = `hsla(${hue + 6}, 74%, 42%, 0.72)`;
      ctx.beginPath();
      ctx.moveTo(r * 0.28, -r * 0.5);
      ctx.quadraticCurveTo(-r * 0.1, -r * (1.0 + v.b * 0.25) + dorsalSway, -r * 0.62, -r * 0.46);
      ctx.closePath();
      ctx.fill();

      // Fusiform body: counter-shaded top-to-bottom like a real pelagic fish.
      const bodyGradient = ctx.createLinearGradient(0, -r * 0.62, 0, r * 0.62);
      bodyGradient.addColorStop(0, `hsla(${hue - 10}, 72%, 24%, 0.96)`);
      bodyGradient.addColorStop(0.42, `hsla(${hue}, 80%, 47%, 0.96)`);
      bodyGradient.addColorStop(0.78, `hsla(${hue + 18}, 78%, 66%, 0.95)`);
      bodyGradient.addColorStop(1, `hsla(${hue + 26}, 82%, 78%, 0.92)`);
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.moveTo(r * 1.42, r * 0.02);
      ctx.bezierCurveTo(r * 0.95, -r * 0.6, -r * 0.25, -r * 0.6, -r * 0.95, -r * 0.12);
      ctx.quadraticCurveTo(-r * 1.05, 0, -r * 0.95, r * 0.12);
      ctx.bezierCurveTo(-r * 0.25, r * 0.6, r * 0.95, r * 0.6, r * 1.42, r * 0.02);
      ctx.closePath();
      ctx.fill();

      // Flank sheen following the midline.
      ctx.strokeStyle = `hsla(${hue + 42}, 100%, 84%, ${0.14 + Math.sin(time * 2.6) * 0.08})`;
      ctx.lineWidth = Math.max(0.8, r * 0.07);
      ctx.beginPath();
      ctx.moveTo(r * 1.1, -r * 0.04);
      ctx.quadraticCurveTo(0, -r * 0.16, -r * 0.85, -r * 0.02);
      ctx.stroke();

      // Pectoral fin paddles with its own phase along the same spine wave.
      const pectoral = travelingSpineWave(0.3, swim, 3.2, 7).offset;
      ctx.save();
      ctx.translate(r * 0.12, r * 0.3);
      ctx.rotate(0.5 + pectoral * 0.35);
      ctx.fillStyle = `hsla(${hue + 10}, 80%, 62%, 0.78)`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-r * 0.1, r * 0.4, -r * 0.52, r * 0.52);
      ctx.quadraticCurveTo(-r * 0.18, r * 0.16, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Gill cover
      ctx.strokeStyle = `hsla(${hue - 14}, 70%, 22%, 0.55)`;
      ctx.lineWidth = Math.max(0.8, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(r * 0.55, -r * 0.3);
      ctx.quadraticCurveTo(r * 0.38, 0, r * 0.52, r * 0.3);
      ctx.stroke();

      // Jaw — hangs open as hunger rises, telegraphing the hunt.
      const jawOpen = Math.min(1, org.hunger / 70);
      ctx.strokeStyle = `hsla(${hue - 18}, 60%, 16%, 0.8)`;
      ctx.lineWidth = Math.max(1, r * 0.07);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r * 1.38, r * 0.05);
      ctx.quadraticCurveTo(r * 1.1, r * (0.14 + jawOpen * 0.16), r * 0.86, r * (0.16 + jawOpen * 0.1));
      ctx.stroke();

      if (highDetail && jawOpen > 0.35) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 3; i++) {
          const tx = r * (1.28 - i * 0.14);
          const ty = r * (0.07 + i * 0.008);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - r * 0.035, ty + r * 0.09 * jawOpen + r * 0.02);
          ctx.lineTo(tx - r * 0.07, ty);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Predatory eye: angled socket, amber iris, slit pupil, brow ridge.
      const ex = r * 0.66;
      const ey = -r * 0.2;
      ctx.fillStyle = `hsla(${hue - 16}, 60%, 14%, 0.9)`;
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.19, r * 0.16, -0.25, 0, Math.PI * 2);
      ctx.fill();
      const iris = ctx.createRadialGradient(ex - r * 0.04, ey - r * 0.05, 0, ex, ey, r * 0.13);
      iris.addColorStop(0, '#fefce8');
      iris.addColorStop(0.5, '#fbbf24');
      iris.addColorStop(1, '#b45309');
      ctx.fillStyle = iris;
      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.125, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.ellipse(ex + r * 0.04, ey, r * 0.035, r * 0.1, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(ex - r * 0.05, ey - r * 0.06, Math.max(0.5, r * 0.03), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue - 14}, 70%, 18%, 0.75)`;
      ctx.lineWidth = Math.max(0.9, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(ex - r * 0.28, ey - r * 0.3);
      ctx.lineTo(ex + r * 0.22, ey - r * 0.16);
      ctx.stroke();

      // Photophores: bioluminescent ventral dots.
      if (highDetail) {
        const lum = 0.25 + (org.genome.bioluminescence || 0.7) * 0.5;
        for (let i = 0; i < 4; i++) {
          const px = r * (0.55 - i * 0.32);
          const py = r * (0.34 + (Math.abs(px) / r) * 0.12);
          ctx.fillStyle = `hsla(${hue + 40}, 100%, 88%, ${lum * (0.5 + Math.sin(time * 3 + i) * 0.3)})`;
          ctx.beginPath();
          ctx.arc(px, py, r * 0.045, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Decomposer: a bioluminescent mushroom with gills, spots and mycelium.
      const capW = r * (0.88 + v.a * 0.3);
      const capH = r * (0.72 + v.b * 0.2) * (1 + breath * 0.07);
      const lean = Math.sin(time * 0.7 + org.pulsePhase) * 0.06;

      ctx.save();
      ctx.rotate(lean);

      // Ground-hugging mycelium strands.
      ctx.strokeStyle = `hsla(${hue}, 55%, 72%, 0.35)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const dir = i % 2 === 0 ? 1 : -1;
        const reach = r * (0.9 + (i >> 1) * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, r * 0.92);
        ctx.quadraticCurveTo(dir * reach * 0.5, r * (1.05 + Math.sin(time * 1.4 + i) * 0.05), dir * reach, r * 0.98);
        ctx.stroke();
      }

      // Stipe with an annulus ring.
      const stipe = ctx.createLinearGradient(-r * 0.16, 0, r * 0.16, 0);
      stipe.addColorStop(0, 'hsl(46, 30%, 62%)');
      stipe.addColorStop(0.4, 'hsl(46, 42%, 86%)');
      stipe.addColorStop(1, 'hsl(44, 32%, 55%)');
      ctx.fillStyle = stipe;
      ctx.beginPath();
      ctx.moveTo(-r * 0.17, r * 0.95);
      ctx.quadraticCurveTo(-r * 0.13, r * 0.4, -r * 0.12, -r * 0.02);
      ctx.lineTo(r * 0.12, -r * 0.02);
      ctx.quadraticCurveTo(r * 0.13, r * 0.4, r * 0.17, r * 0.95);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(120, 96, 60, 0.4)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.34, r * 0.15, r * 0.05, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Gills fan out under the cap.
      const gillCount = highDetail ? 7 : 5;
      ctx.strokeStyle = `hsla(${hue - 18}, 45%, 30%, 0.55)`;
      ctx.lineWidth = 0.9;
      for (let i = 0; i < gillCount; i++) {
        const t = (i + 0.5) / gillCount;
        const gx = (t * 2 - 1) * capW * 0.92;
        ctx.beginPath();
        ctx.moveTo(gx * 0.18, r * 0.02);
        ctx.lineTo(gx, -capH * 0.16);
        ctx.stroke();
      }

      // Cap dome with a subtle underside lip.
      const cap = ctx.createRadialGradient(-capW * 0.3, -capH * 0.55, r * 0.05, 0, -capH * 0.2, capW * 1.25);
      cap.addColorStop(0, lightColor);
      cap.addColorStop(0.5, `hsla(${hue + 4}, 82%, 56%, 0.95)`);
      cap.addColorStop(1, `hsla(${hue - 14}, 72%, 30%, 0.92)`);
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.moveTo(-capW, -capH * 0.05);
      ctx.bezierCurveTo(-capW * 0.9, -capH * 1.25, capW * 0.9, -capH * 1.25, capW, -capH * 0.05);
      ctx.quadraticCurveTo(0, capH * 0.16, -capW, -capH * 0.05);
      ctx.closePath();
      ctx.fill();

      // Crown rim light.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = Math.max(0.8, r * 0.05);
      ctx.beginPath();
      ctx.moveTo(-capW * 0.55, -capH * 0.62);
      ctx.quadraticCurveTo(0, -capH * 1.18, capW * 0.55, -capH * 0.62);
      ctx.stroke();

      // Classic cap spots, placed deterministically per species.
      const spotCount = highDetail ? 4 : 3;
      for (let i = 0; i < spotCount; i++) {
        const su = ((v.c * 1.7 + i * 0.63) % 1.4) - 0.7; // -0.7..0.7 across the dome
        const sx = su * capW;
        const sy = -capH * (0.35 + (1 - su * su) * 0.5);
        ctx.fillStyle = 'rgba(255, 252, 245, 0.72)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, r * (0.06 + (((i * 37) % 10) / 10) * 0.05), r * (0.05 + (((i * 53) % 10) / 10) * 0.04), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Specular droplet
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(-capW * 0.34, -capH * 0.55, r * 0.09, r * 0.06, -0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Rising spore motes above the cap.
      if (highDetail) {
        for (let i = 0; i < 3; i++) {
          const cycle = (time * 0.35 + i * 0.37) % 1;
          const sy = -capH - r * (0.2 + cycle * 1.5);
          const sx = Math.sin(time * 1.8 + i * 2.2) * r * 0.5;
          ctx.fillStyle = `rgba(255, 250, 235, ${(1 - cycle) * 0.6})`;
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.045, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private drawShockwaves(ctx: CanvasRenderingContext2D, shockwaves: Shockwave[]) {
    ctx.save();
    for (const sw of shockwaves) {
      const alpha = 1 - sw.elapsed / sw.duration;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawConsumptionEffects(ctx: CanvasRenderingContext2D, effects: ConsumptionEffect[]) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const effect of effects) {
      const progress = Math.min(1, effect.elapsed / effect.duration);
      const fade = Math.pow(1 - progress, 1.5);
      const pulse = Math.sin(progress * Math.PI);
      const palette = effect.kind === 'hunt'
        ? { core: '255, 243, 184', accent: '251, 146, 60', ring: '253, 186, 116' }
        : effect.kind === 'mutagen'
          ? { core: '255, 235, 255', accent: '232, 121, 249', ring: '240, 171, 252' }
          : effect.kind === 'scavenge'
            ? { core: '236, 253, 245', accent: '94, 234, 212', ring: '153, 246, 228' }
            : { core: '240, 253, 244', accent: '110, 231, 183', ring: '167, 243, 208' };
      const random = mulberry32(effect.seed);
      const burstRadius = 10 + progress * (effect.kind === 'hunt' ? 36 : 25);

      const glow = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, burstRadius * 1.45);
      glow.addColorStop(0, `rgba(${palette.core}, ${fade * 0.9})`);
      glow.addColorStop(0.24, `rgba(${palette.accent}, ${fade * 0.45})`);
      glow.addColorStop(1, `rgba(${palette.accent}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, burstRadius * 1.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${palette.ring}, ${fade * 0.8})`;
      ctx.lineWidth = Math.max(1, 2.4 * fade);
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 5 + progress * (effect.kind === 'hunt' ? 28 : 20), 0, Math.PI * 2);
      ctx.stroke();

      const particleCount = effect.kind === 'hunt' ? 12 : 8;
      for (let index = 0; index < particleCount; index++) {
        const angle = random() * Math.PI * 2;
        const speed = 12 + random() * (effect.kind === 'hunt' ? 32 : 22);
        const distance = speed * progress * (1 - progress * 0.35);
        const size = (1.4 + random() * 1.9) * fade;
        const x = effect.x + Math.cos(angle) * distance;
        const y = effect.y + Math.sin(angle) * distance - progress * progress * 9;

        ctx.fillStyle = `rgba(${index % 3 === 0 ? palette.core : palette.accent}, ${fade * (0.58 + random() * 0.3)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect.kind === 'hunt') {
        ctx.strokeStyle = `rgba(${palette.core}, ${pulse * fade * 0.8})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(effect.x - burstRadius * 0.5, effect.y - burstRadius * 0.5);
        ctx.lineTo(effect.x + burstRadius * 0.5, effect.y + burstRadius * 0.5);
        ctx.moveTo(effect.x + burstRadius * 0.5, effect.y - burstRadius * 0.5);
        ctx.lineTo(effect.x - burstRadius * 0.5, effect.y + burstRadius * 0.5);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Renders one species as a framed portrait (도감·인스펙터 프리뷰).
   * Uses the exact same creature drawing code as the live terrarium so UI
   * previews can never drift away from what players actually see.
   */
  public renderSpeciesPortrait(
    ctx: CanvasRenderingContext2D,
    size: number,
    species: SpeciesInfo,
    time: number
  ) {
    ctx.clearRect(0, 0, size, size);

    const c = size / 2;
    const backdrop = ctx.createRadialGradient(c, size * 0.38, 0, c, c, size * 0.66);
    backdrop.addColorStop(0, 'rgba(94, 234, 212, 0.12)');
    backdrop.addColorStop(0.55, 'rgba(10, 24, 34, 0.5)');
    backdrop.addColorStop(1, 'rgba(3, 9, 15, 0.88)');
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, size, size);

    // Specimen-dish ring frames the subject like a microscope slide.
    ctx.strokeStyle = 'rgba(148, 233, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c, c, size * 0.44, 0, Math.PI * 2);
    ctx.stroke();

    const org = this.synthesizePortraitOrganism(species);

    ctx.save();
    ctx.translate(c, size * 0.55);

    ctx.fillStyle = 'rgba(2, 10, 16, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, org.sizePx * 1.05, org.sizePx * 0.95, org.sizePx * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = species.glowColor;
    ctx.shadowBlur = size * 0.1 * (0.4 + (species.baseGenome.bioluminescence || 0.7));
    this.drawCreatureShape(ctx, org, time, true);
    ctx.restore();
  }

  private synthesizePortraitOrganism(species: SpeciesInfo): Organism {
    return {
      id: `portrait-${species.id}`,
      speciesId: species.id,
      trophicLevel: species.trophicLevel,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      energy: 80,
      maxEnergy: 100,
      age: 10,
      lifespan: 600,
      hunger: 12,
      reproductionCooldown: 0,
      generation: 1,
      state: 'resting',
      genome: { ...species.baseGenome },
      parentIds: [],
      pulsePhase: 0,
      sizePx: 26,
      isDead: false,
    };
  }

  private drawWeatherEffects(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    env: EnvironmentState,
    time: number
  ) {
    ctx.save();

    // Rain becomes a real weather event at high moisture, rather than only a
    // slider number: streaks hit the waterline and create visible ripples.
    if (env.moisture >= 68) {
      const intensity = Math.min(1, (env.moisture - 68) / 32);
      const dropCount = Math.floor(10 + intensity * 34);
      const waterY = 72 + (100 - env.moisture) * 0.13;
      ctx.strokeStyle = `rgba(190, 235, 255, ${0.18 + intensity * 0.34})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < dropCount; i++) {
        const x = 62 + ((i * 47.17 + time * (95 + (i % 5) * 17)) % Math.max(1, w - 124));
        const travel = (i * 29.3 + time * (210 + (i % 4) * 33)) % Math.max(1, h - 110);
        const y = 48 + travel;
        ctx.beginPath();
        ctx.moveTo(x, y - 7 - intensity * 7);
        ctx.lineTo(x - 1.5, y);
        ctx.stroke();

        if (y > waterY - 10 && i % 3 === 0) {
          const ripple = 3 + ((time * 8 + i) % 1) * (5 + intensity * 7);
          ctx.strokeStyle = `rgba(214, 248, 255, ${0.15 + intensity * 0.25})`;
          ctx.beginPath();
          ctx.ellipse(x, waterY + 3, ripple, Math.max(1, ripple * 0.18), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(190, 235, 255, ${0.18 + intensity * 0.34})`;
        }
      }
    }

    // Frost crystals when temperature < 5°C
    if (env.temperature < 5) {
      const frostAlpha = Math.min(0.6, (5 - env.temperature) * 0.05);
      ctx.fillStyle = `rgba(186, 230, 253, ${frostAlpha})`;
      ctx.fillRect(50, 40, w - 100, 20); // Top glass rim frost
      ctx.fillRect(50, h - 60, w - 100, 20); // Bottom frost

      ctx.strokeStyle = `rgba(224, 242, 254, ${frostAlpha * 0.72})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 13; i++) {
        const x = 62 + ((i * 83.7) % Math.max(1, w - 124));
        const y = 62 + ((i * 37.1) % Math.max(1, h - 142));
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
      }
    }

    // Heat haze and steam make a hot terrarium immediately legible.
    if (env.temperature > 32) {
      const intensity = Math.min(1, (env.temperature - 32) / 13);
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 11 + Math.floor(intensity * 10); i++) {
        const x = 70 + ((i * 71.9 + Math.sin(time * 1.5 + i) * 24) % Math.max(1, w - 140));
        const y = h - 88 - ((time * (17 + (i % 4) * 4) + i * 29) % Math.max(1, h * 0.45));
        const steam = ctx.createRadialGradient(x, y, 0, x, y, 12 + intensity * 20);
        steam.addColorStop(0, `rgba(255, 236, 204, ${0.05 + intensity * 0.11})`);
        steam.addColorStop(1, 'rgba(255, 196, 122, 0)');
        ctx.fillStyle = steam;
        ctx.beginPath();
        ctx.ellipse(x, y, 8 + intensity * 8, 18 + intensity * 16, Math.sin(time + i) * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawHealthAtmosphere(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    ecosystemHealth: number,
    time: number
  ) {
    ctx.save();
    if (ecosystemHealth >= 75) {
      const sparkleCount = Math.floor((ecosystemHealth - 70) / 6);
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < sparkleCount; i++) {
        const x = 74 + ((i * 113.3 + time * (12 + i)) % Math.max(1, w - 148));
        const y = 90 + ((i * 61.7 + Math.sin(time * 1.4 + i) * 16) % Math.max(1, h - 185));
        const r = 1.2 + (i % 3) * 0.5;
        ctx.fillStyle = `rgba(220, 255, 232, ${0.26 + (ecosystemHealth - 75) * 0.006})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (ecosystemHealth < 45) {
      const severity = (45 - ecosystemHealth) / 45;
      const haze = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, Math.max(w, h) * 0.64);
      haze.addColorStop(0, 'rgba(90, 61, 35, 0)');
      haze.addColorStop(1, `rgba(77, 43, 20, ${0.12 + severity * 0.22})`);
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(235, 179, 110, ${0.1 + severity * 0.16})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const x = 75 + ((i * 93.1 + time * (8 + i)) % Math.max(1, w - 150));
        const y = 90 + ((i * 53.9 + time * (4 + (i % 3))) % Math.max(1, h - 175));
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 3);
        ctx.lineTo(x + 5, y - 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
