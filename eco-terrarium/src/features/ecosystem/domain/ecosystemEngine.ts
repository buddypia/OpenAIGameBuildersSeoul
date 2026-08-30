import {
  Organism,
  FoodPellet,
  SporeParticle,
  EnvironmentState,
  SpeciesInfo,
  EcosystemStats,
  Genome,
  HiveEcosystemDNA,
  SimHistoryPoint,
} from '../../../shared/kernel/types';
import { INITIAL_SPECIES_DATABASE } from './speciesData';
import { mutateGenome, crossoverGenomes, checkSpeciation } from './genetics';
import { calculateShannonIndex, calculateEcosystemScores } from './lotkaVolterra';

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  duration: number;
  elapsed: number;
}

export interface ConsumptionEffect {
  x: number;
  y: number;
  kind: 'graze' | 'hunt' | 'scavenge' | 'mutagen';
  duration: number;
  elapsed: number;
  seed: number;
}

export interface SimulationCallbacks {
  onSpeciesUnlocked?: (species: SpeciesInfo) => void;
  onAudioEvent?: (type: 'eat' | 'reproduce' | 'evolve' | 'death' | 'tap' | 'drop', pitch?: number) => void;
}

/**
 * Converts a rate expressed per simulated second into a frame-independent
 * event roll. Repeated short frames and one long frame now have the same
 * aggregate probability, so gameplay does not depend on display FPS.
 */
export function occursDuringInterval(ratePerSecond: number, seconds: number, random = Math.random): boolean {
  if (ratePerSecond <= 0 || seconds <= 0) return false;
  const probability = 1 - Math.exp(-ratePerSecond * seconds);
  return random() < probability;
}

function clampTrait(value: number, min: number, max: number): number {
  return Number(Math.max(min, Math.min(max, value)).toFixed(2));
}

export class EcosystemEngine {
  private static readonly MAX_ORGANISMS = 100;
  private static readonly MAX_FOOD_PELLETS = 200;
  private static readonly MAX_CONSUMPTION_EFFECTS = 18;
  private static readonly SPORE_GERMINATION_RATE = 0.3;
  private static readonly SPORE_RELEASE_RATE = 0.3;
  private static readonly SPECIATION_RATE = 0.08;
  private static readonly ASEXUAL_BUDDING_RATE = 0.18;
  public organisms: Organism[] = [];
  public foodPellets: FoodPellet[] = [];
  public spores: SporeParticle[] = [];
  public shockwaves: Shockwave[] = [];
  public consumptionEffects: ConsumptionEffect[] = [];
  public speciesList: SpeciesInfo[] = [];
  public history: SimHistoryPoint[] = [];

  public bounds = { width: 800, height: 600, paddingX: 60, paddingY: 50 };
  public totalSimAge: number = 0;
  public totalDeadCount: number = 0;
  public generationRecord: number = 1;
  public lastHistoryUpdate: number = 0;
  public prevTemp: number = 22;
  public tempShockDetected: boolean = false;

  private callbacks: SimulationCallbacks = {};

  constructor(callbacks: SimulationCallbacks = {}) {
    this.callbacks = callbacks;
    this.speciesList = JSON.parse(JSON.stringify(INITIAL_SPECIES_DATABASE));
    this.seedInitialEcosystem();
  }

  public setCallbacks(callbacks: SimulationCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Updates the playable area after the canvas has measured its rendered size.
   * Existing entities are remapped by their relative habitat position so the
   * initial population does not bunch up when the default 800px simulation
   * area is displayed in a narrower or wider viewport.
   */
  public resizeBounds(width: number, height: number, paddingX: number, paddingY: number) {
    const previousBounds = this.bounds;
    const nextBounds = { width, height, paddingX, paddingY };
    if (
      previousBounds.width === nextBounds.width &&
      previousBounds.height === nextBounds.height &&
      previousBounds.paddingX === nextBounds.paddingX &&
      previousBounds.paddingY === nextBounds.paddingY
    ) {
      return;
    }

    const remapX = (x: number) => this.remapCoordinate(
      x,
      previousBounds.paddingX,
      previousBounds.width - previousBounds.paddingX,
      nextBounds.paddingX,
      nextBounds.width - nextBounds.paddingX
    );
    const remapY = (y: number) => this.remapCoordinate(
      y,
      previousBounds.paddingY,
      previousBounds.height - previousBounds.paddingY,
      nextBounds.paddingY,
      nextBounds.height - nextBounds.paddingY
    );

    this.bounds = nextBounds;
    for (const organism of this.organisms) {
      organism.x = remapX(organism.x);
      organism.y = remapY(organism.y);
      this.clampOrganismToBounds(organism);
    }
    for (const pellet of this.foodPellets) {
      pellet.x = remapX(pellet.x);
      pellet.y = remapY(pellet.y);
    }
    for (const spore of this.spores) {
      spore.x = remapX(spore.x);
      spore.y = remapY(spore.y);
    }
    for (const shockwave of this.shockwaves) {
      shockwave.x = remapX(shockwave.x);
      shockwave.y = remapY(shockwave.y);
    }
    for (const effect of this.consumptionEffects) {
      effect.x = remapX(effect.x);
      effect.y = remapY(effect.y);
    }
  }

  public seedInitialEcosystem() {
    this.organisms = [];
    this.foodPellets = [];
    this.spores = [];
    this.shockwaves = [];
    this.consumptionEffects = [];
    this.history = [];
    this.totalSimAge = 0;
    this.totalDeadCount = 0;
    this.generationRecord = 1;
    this.lastHistoryUpdate = 0;
    this.prevTemp = 22;
    this.tempShockDetected = false;

    // Seed 12 Producers (Lumi Flora)
    for (let i = 0; i < 12; i++) {
      this.spawnOrganism('lumi_flora', undefined, undefined, 1);
    }
    // Seed 6 Herbivores (Jelly Wiggle)
    for (let i = 0; i < 6; i++) {
      this.spawnOrganism('jelly_wiggle', undefined, undefined, 1);
    }
    // Seed 2 Predators (Phantom Lip)
    for (let i = 0; i < 2; i++) {
      this.spawnOrganism('phantom_lip', undefined, undefined, 1);
    }
    // Seed 4 Decomposers (Mycel Linker)
    for (let i = 0; i < 4; i++) {
      this.spawnOrganism('mycel_linker', undefined, undefined, 1);
    }

    // Initial Food Pellets
    for (let i = 0; i < 8; i++) {
      this.addFoodPellet('nutrient', Math.random() * 500 + 150, Math.random() * 300 + 200);
    }
  }

  /**
   * Returns the engine to its pristine first-launch state. Unlike
   * `seedInitialEcosystem`, this also relocks the species codex, so a player
   * who resets starts discovery over rather than keeping past unlocks.
   */
  public reset(): void {
    this.speciesList = JSON.parse(JSON.stringify(INITIAL_SPECIES_DATABASE));
    this.seedInitialEcosystem();
  }

  public spawnOrganism(
    speciesId: string,
    x?: number,
    y?: number,
    generation: number = 1,
    customGenome?: Genome,
    parentIds: string[] = []
  ): Organism | null {
    const sp = this.speciesList.find((s) => s.id === speciesId);
    if (!sp || this.organisms.length >= EcosystemEngine.MAX_ORGANISMS) return null;

    const genome = customGenome ? { ...customGenome } : { ...sp.baseGenome };
    const posX = x ?? (Math.random() * (this.bounds.width - 2 * this.bounds.paddingX) + this.bounds.paddingX);
    // Producers & decomposers usually near bottom or water column
    const defaultY = sp.trophicLevel === 'decomposer'
      ? this.bounds.height - this.bounds.paddingY - Math.random() * 60
      : Math.random() * (this.bounds.height - 2 * this.bounds.paddingY) + this.bounds.paddingY;
    const posY = y ?? defaultY;

    const organism: Organism = {
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      speciesId: sp.id,
      customName: undefined,
      trophicLevel: sp.trophicLevel,
      x: posX,
      y: posY,
      vx: (Math.random() - 0.5) * genome.speed,
      vy: (Math.random() - 0.5) * genome.speed,
      angle: Math.random() * Math.PI * 2,
      energy: Math.min(80, 100 * genome.size),
      maxEnergy: 100 * genome.size,
      age: 0,
      lifespan: (sp.trophicLevel === 'producer' ? 45 : 60) * (genome.defense * 0.5 + 0.8),
      hunger: 20,
      reproductionCooldown: 10 + Math.random() * 5,
      generation,
      state: 'wandering',
      genome,
      parentIds,
      pulsePhase: Math.random() * Math.PI * 2,
      sizePx: 12 * genome.size,
      isDead: false,
    };

    this.organisms.push(organism);
    if (generation > this.generationRecord) {
      this.generationRecord = generation;
    }

    return organism;
  }

  public addFoodPellet(
    type: 'nutrient' | 'mutagen' | 'carcass',
    x: number,
    y: number,
    energy = 35,
    emitAudio = true
  ) {
    if (this.foodPellets.length >= EcosystemEngine.MAX_FOOD_PELLETS) {
      this.foodPellets.shift();
    }
    this.foodPellets.push({
      id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.8 + 0.3, // gently sinking to bottom
      energyValue: energy,
      radius: type === 'mutagen' ? 6 : type === 'carcass' ? 8 : 5,
      decayTime: type === 'carcass' ? 30 : 50,
    });
    if (emitAudio) this.callbacks.onAudioEvent?.('drop');
  }

  /**
   * 현재 환경에서 해금 가능한 미해금 종 하나를 골라, 그 종의 부모 개체를
   * "이미 환경 압력을 받아 유전자가 표류한" 상태로 유리병에 넣는다.
   *
   * 종분화 판정 자체는 손대지 않는다. 평소와 똑같은 checkSpeciation이
   * 몇 초 안에 자연히 발화하도록 조건만 갖춰 주는 것이라, 시연 중에도
   * 신종은 언제나 종분화 규칙을 통과해서 태어난다.
   *
   * 기본 8마리인 이유: 종분화 판정은 개체당 SPECIATION_RATE(0.08/초)로 굴러가고
   * 프리셋은 2배속이므로 초당 약 1.28회가 된다. 5초면 누락 확률이 0.2% 아래로
   * 떨어져, 무대에서 "5초 안에 신종이 태어납니다"를 말할 수 있게 된다.
   */
  public primeSpeciation(env: EnvironmentState, count = 8): SpeciesInfo | null {
    const target = this.speciesList.find((sp) => {
      if (sp.unlocked) return false;
      const cond = sp.spawnConditions;
      // 특수 조건(밤·열충격·하모니)은 환경 슬라이더만으로 보장할 수 없으므로 제외한다.
      if (!cond?.parentSpeciesId || cond.specialCondition) return false;
      if (!this.speciesList.some((p) => p.id === cond.parentSpeciesId && p.unlocked)) return false;
      if (cond.minSun !== undefined && env.sunlight < cond.minSun) return false;
      if (cond.maxSun !== undefined && env.sunlight > cond.maxSun) return false;
      if (cond.minMoist !== undefined && env.moisture < cond.minMoist) return false;
      if (cond.maxMoist !== undefined && env.moisture > cond.maxMoist) return false;
      if (cond.minTemp !== undefined && env.temperature < cond.minTemp) return false;
      if (cond.maxTemp !== undefined && env.temperature > cond.maxTemp) return false;
      if (cond.minNutrients !== undefined && env.nutrients < cond.minNutrients) return false;
      return true;
    });
    if (!target) return null;

    const bg = target.baseGenome;
    const innerW = this.bounds.width - 2 * this.bounds.paddingX;
    const innerH = this.bounds.height - 2 * this.bounds.paddingY;
    for (let i = 0; i < count; i++) {
      // 바닥 한 줄로 몰리면 무대에서 "갑자기 생물이 우르르 생겼다"로 보인다.
      // 유리병 전체에 흩어 놓아 원래 있던 개체군처럼 섞이게 한다.
      const spreadX = this.bounds.paddingX + ((i + 0.5) / count) * innerW + (Math.random() - 0.5) * (innerW / count);
      const spreadY = this.bounds.paddingY + Math.random() * innerH;
      const org = this.spawnOrganism(target.spawnConditions.parentSpeciesId!, spreadX, spreadY, 2);
      if (!org) break;

      // 형질은 목표 종 쪽으로 표류시키되 색(hue)은 부모 것을 남긴다 —
      // 아직 부모 종으로 보이지만 유전자는 이미 경계에 와 있는 상태.
      const jitter = (spread: number) => (Math.random() - 0.5) * spread;
      org.genome = {
        ...org.genome,
        size: clampTrait(bg.size + jitter(0.3), 0.5, 2.5),
        speed: clampTrait(bg.speed + jitter(0.3), 0.4, 3.0),
        tempOpt: clampTrait(bg.tempOpt + jitter(4), -10, 45),
        defense: clampTrait(bg.defense + jitter(0.14), 0, 1),
      };
      org.sizePx = 12 * org.genome.size;
      // 종분화 판정은 age > 8인 개체만 대상으로 하므로 세대를 미리 넘겨 둔다.
      org.age = 9;
    }

    return target;
  }

  /** Restores the shareable state while keeping all engine invariants intact. */
  public restoreFromDNA(dna: HiveEcosystemDNA): void {
    const unlockedIds = new Set(dna.speciesUnlocked);
    const defaultUnlockedIds = new Set(
      INITIAL_SPECIES_DATABASE.filter((species) => species.unlocked).map((species) => species.id)
    );
    this.speciesList.forEach((species) => {
      species.unlocked = defaultUnlockedIds.has(species.id) || unlockedIds.has(species.id);
    });

    this.organisms = [];
    this.foodPellets = [];
    this.spores = [];
    this.shockwaves = [];
    this.consumptionEffects = [];
    this.history = [];
    this.totalSimAge = Math.round(dna.stats.totalAge);
    this.totalDeadCount = 0;
    this.generationRecord = 1;
    this.lastHistoryUpdate = this.totalSimAge;
    this.prevTemp = dna.env.temperature;
    this.tempShockDetected = false;

    for (const saved of dna.organisms) {
      const species = this.speciesList.find((candidate) => candidate.id === saved.speciesId);
      if (!species) continue;
      species.unlocked = true;
      const organism = this.spawnOrganism(saved.speciesId, undefined, undefined, saved.generation, saved.genome);
      if (organism) organism.customName = saved.customName;
    }

    // A malformed-but-valid empty legacy payload must not leave the game in an
    // unrecoverable state. New payloads normally have a full population.
    if (this.organisms.length === 0) this.seedInitialEcosystem();
  }

  public tapGlass(x: number, y: number) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 180,
      strength: 4.5,
      duration: 0.8,
      elapsed: 0,
    });
    this.callbacks.onAudioEvent?.('tap');
  }

  /**
   * Main Simulation Step
   */
  public update(dt: number, env: EnvironmentState) {
    if (env.timeSpeed <= 0) return;
    const effDt = Math.min(0.1, dt) * env.timeSpeed;
    this.totalSimAge += effDt;

    // Detect thermal shock (-10 to 40 degree drastic swings)
    if (Math.abs(env.temperature - this.prevTemp) > 15) {
      this.tempShockDetected = true;
    }
    this.prevTemp = env.temperature;

    // 1. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.elapsed += effDt;
      sw.radius += (sw.maxRadius / sw.duration) * effDt;
      if (sw.elapsed >= sw.duration) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Short-lived visual feedback for successful feeding. The renderer derives
    // particle positions from a seed, keeping this simulation data compact.
    for (let i = this.consumptionEffects.length - 1; i >= 0; i--) {
      const effect = this.consumptionEffects[i];
      effect.elapsed += effDt;
      if (effect.elapsed >= effect.duration) {
        this.consumptionEffects.splice(i, 1);
      }
    }

    // 2. Update Food Pellets
    for (let i = this.foodPellets.length - 1; i >= 0; i--) {
      const p = this.foodPellets[i];
      p.decayTime -= effDt;
      p.x += p.vx * effDt * 30;
      p.y += p.vy * effDt * 30;

      // Sinking to terrarium bottom
      const floorY = this.bounds.height - this.bounds.paddingY - p.radius;
      if (p.y > floorY) {
        p.y = floorY;
        p.vx *= 0.8;
      }

      if (p.decayTime <= 0) {
        this.foodPellets.splice(i, 1);
      }
    }

    // 3. Update Spores
    for (let i = this.spores.length - 1; i >= 0; i--) {
      const sp = this.spores[i];
      sp.lifespan -= effDt;
      sp.x += sp.vx * effDt * 40;
      sp.y += sp.vy * effDt * 40;

      // Spore settles and germinates if conditions are good
      if (sp.lifespan <= 0 || occursDuringInterval(EcosystemEngine.SPORE_GERMINATION_RATE, effDt)) {
        if (this.organisms.filter((o) => o.trophicLevel === 'producer').length < 35) {
          this.spawnOrganism(sp.speciesId, sp.x, sp.y, 1, sp.genome);
        }
        this.spores.splice(i, 1);
      }
    }

    // 4. Update Organisms
    const currentProducers = this.organisms.filter((o) => o.trophicLevel === 'producer' && !o.isDead);
    const currentHerbivores = this.organisms.filter((o) => o.trophicLevel === 'herbivore' && !o.isDead);
    const currentPredators = this.organisms.filter((o) => o.trophicLevel === 'predator' && !o.isDead);
    const currentDecomposers = this.organisms.filter((o) => o.trophicLevel === 'decomposer' && !o.isDead);

    const isNight = env.dayNightCycle > 0.4 && env.dayNightCycle < 0.9;
    const harmonyHigh = currentProducers.length > 3 && currentHerbivores.length > 2 && currentPredators.length > 1;

    for (let i = this.organisms.length - 1; i >= 0; i--) {
      const org = this.organisms[i];
      if (org.isDead) continue;

      org.age += effDt;
      org.pulsePhase += effDt * (1.5 + org.genome.speed);
      org.reproductionCooldown = Math.max(0, org.reproductionCooldown - effDt);

      // Temperature Stress & Metabolism Calculation
      const tempDiff = Math.abs(env.temperature - org.genome.tempOpt);
      const tempStress = Math.max(0, (tempDiff - org.genome.tempTol) * 0.15);
      const energyBurn = (org.genome.metabolism * 0.4 + tempStress * 0.5 + org.genome.speed * 0.1) * effDt;
      org.energy -= energyBurn;
      org.hunger = Math.min(100, 100 - (org.energy / org.maxEnergy) * 100);

      // Environmental Production for Producers
      if (org.trophicLevel === 'producer') {
        const sunBenefit = (env.sunlight / 100) * 1.8;
        const moistBenefit = (env.moisture / 100) * 1.2;
        // Nutrients previously appeared in the HUD and evolution checks only. Feed
        // them back into photosynthesis so the player's fourth environment control
        // has a readable, bounded impact on the base of the food chain.
        const nutrientBenefit = 0.5 + (env.nutrients / 100) * 0.8;
        org.energy = Math.min(
          org.maxEnergy,
          org.energy + (sunBenefit * moistBenefit * nutrientBenefit * 1.2) * effDt * 5
        );

        // Spore release
        if (
          org.energy > org.maxEnergy * 0.8 &&
          org.reproductionCooldown <= 0 &&
          occursDuringInterval(EcosystemEngine.SPORE_RELEASE_RATE, effDt)
        ) {
          this.spores.push({
            id: `spore_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            x: org.x,
            y: org.y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 1.2 - 0.2, // buoyant upwards
            speciesId: org.speciesId,
            genome: mutateGenome(org.genome, env),
            color: `hsl(${org.genome.hue}, 80%, 65%)`,
            lifespan: 6 + Math.random() * 4,
          });
          org.reproductionCooldown = 12 + Math.random() * 8;
        }
      }

      // Shockwave Reaction
      for (const sw of this.shockwaves) {
        const dx = org.x - sw.x;
        const dy = org.y - sw.y;
        const dist = Math.hypot(dx, dy);
        if (dist < sw.radius + 30 && dist > 1) {
          const push = (1 - dist / (sw.radius + 30)) * sw.strength;
          org.vx += (dx / dist) * push;
          org.vy += (dy / dist) * push;
        }
      }

      // Steering / AI Behaviors
      this.handleOrganismBehavior(
        org,
        env,
        effDt,
        currentProducers,
        currentHerbivores,
        currentPredators,
        currentDecomposers
      );

      // Physics Integration & Boundary Collision
      org.x += org.vx * effDt * 40;
      org.y += org.vy * effDt * 40;
      this.handleTerrariumBoundaries(org);

      // Check Speciation / Evolution Check
      if (org.age > 8 && occursDuringInterval(EcosystemEngine.SPECIATION_RATE, effDt)) {
        const newSpecies = checkSpeciation(
          org.speciesId,
          org.genome,
          env,
          this.speciesList,
          {
            totalDeadCount: this.totalDeadCount,
            harmonyHigh,
            isNight,
            tempShock: this.tempShockDetected,
          }
        );
        if (newSpecies && !newSpecies.unlocked) {
          newSpecies.unlocked = true;
          org.speciesId = newSpecies.id;
          org.trophicLevel = newSpecies.trophicLevel;
          this.callbacks.onSpeciesUnlocked?.(newSpecies);
          this.callbacks.onAudioEvent?.('evolve');
        }
      }

      // Check Death
      if (org.energy <= 0 || org.age >= org.lifespan) {
        this.killOrganism(org);
      }
    }

    // Clean up dead organisms
    this.organisms = this.organisms.filter((o) => !o.isDead);

    // Auto-balancer safety net: if completely extinct, allow gentle spontaneous germination
    if (this.organisms.filter((o) => o.trophicLevel === 'producer').length === 0) {
      this.spawnOrganism('lumi_flora', undefined, undefined, 1);
    }

    // Record History Point every 2 seconds
    if (this.totalSimAge - this.lastHistoryUpdate >= 2) {
      this.lastHistoryUpdate = this.totalSimAge;
      const stats = this.getStats();
      this.history.push({
        time: Math.round(this.totalSimAge),
        producers: stats.producerCount,
        herbivores: stats.herbivoreCount,
        predators: stats.predatorCount,
        decomposers: stats.decomposerCount,
        health: stats.ecosystemHealth,
      });
      if (this.history.length > 50) {
        this.history.shift();
      }
    }
  }

  private handleOrganismBehavior(
    org: Organism,
    env: EnvironmentState,
    dt: number,
    producers: Organism[],
    herbivores: Organism[],
    predators: Organism[],
    decomposers: Organism[]
  ) {
    org.state = 'wandering';
    let steerX = 0;
    let steerY = 0;

    // 1. Flee from predators (if Herbivore or Producer)
    if (org.trophicLevel === 'herbivore') {
      for (const pred of predators) {
        const dx = org.x - pred.x;
        const dy = org.y - pred.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 100 && dist > 1) {
          const fleeForce = (1 - dist / 100) * 2.5;
          steerX += (dx / dist) * fleeForce;
          steerY += (dy / dist) * fleeForce;
          org.state = 'fleeing';
        }
      }
    }

    // 2. Forage for Food
    if (org.hunger > 30) {
      if (org.trophicLevel === 'herbivore') {
        // Search for nearest producer or nutrient pellet
        let nearestDist = 180;
        let targetX = 0;
        let targetY = 0;
        let foundTarget = false;

        // Check food pellets
        for (const pellet of this.foodPellets) {
          if (pellet.decayTime <= 0) continue;
          const dist = Math.hypot(pellet.x - org.x, pellet.y - org.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            targetX = pellet.x;
            targetY = pellet.y;
            foundTarget = true;

            // Eat pellet
            if (dist < org.sizePx + pellet.radius) {
              org.energy = Math.min(org.maxEnergy, org.energy + pellet.energyValue);
              if (pellet.type === 'mutagen') {
                org.genome = mutateGenome(org.genome, env, true);
                this.callbacks.onAudioEvent?.('evolve');
                this.addConsumptionEffect(pellet.x, pellet.y, 'mutagen');
              } else {
                this.callbacks.onAudioEvent?.('eat');
                this.addConsumptionEffect(pellet.x, pellet.y, 'graze');
              }
              pellet.decayTime = 0; // consumed
            }
          }
        }

        // Check producers
        if (!foundTarget) {
          for (const prod of producers) {
            if (prod.isDead) continue;
            const dist = Math.hypot(prod.x - org.x, prod.y - org.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              targetX = prod.x;
              targetY = prod.y;
              foundTarget = true;

              // Graze on producer
              if (dist < org.sizePx + prod.sizePx) {
                const bite = Math.min(prod.energy, 25);
                prod.energy -= bite;
                org.energy = Math.min(org.maxEnergy, org.energy + bite * 0.85);
                this.callbacks.onAudioEvent?.('eat');
                this.addConsumptionEffect(prod.x, prod.y, 'graze');
              }
            }
          }
        }

        if (foundTarget && nearestDist > 5) {
          steerX += ((targetX - org.x) / nearestDist) * 1.5;
          steerY += ((targetY - org.y) / nearestDist) * 1.5;
          org.state = 'foraging';
        }
      } else if (org.trophicLevel === 'predator') {
        // Hunt nearest Herbivore
        let nearestDist = 220;
        let targetHerb: Organism | null = null;

        for (const herb of herbivores) {
          const dist = Math.hypot(herb.x - org.x, herb.y - org.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            targetHerb = herb;
          }
        }

        if (targetHerb) {
          steerX += ((targetHerb.x - org.x) / nearestDist) * 2.0;
          steerY += ((targetHerb.y - org.y) / nearestDist) * 2.0;
          org.state = 'foraging';

          // Attack/Catch Herbivore
          if (nearestDist < org.sizePx + targetHerb.sizePx) {
            // Defense check
            if (Math.random() > targetHerb.genome.defense * 0.7) {
              this.killOrganism(targetHerb);
              org.energy = Math.min(org.maxEnergy, org.energy + targetHerb.energy * 0.85);
              this.callbacks.onAudioEvent?.('eat');
              this.addConsumptionEffect(targetHerb.x, targetHerb.y, 'hunt');
            } else {
              // Bounced off shell!
              org.vx *= -1;
              org.vy *= -1;
            }
          }
        }
      } else if (org.trophicLevel === 'decomposer') {
        // Seek carcasses or organic waste at bottom
        let nearestDist = 200;
        let targetX = 0;
        let targetY = 0;
        let foundCarcass = false;

        for (const pellet of this.foodPellets) {
          if (pellet.type === 'carcass' && pellet.decayTime > 0) {
            const dist = Math.hypot(pellet.x - org.x, pellet.y - org.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              targetX = pellet.x;
              targetY = pellet.y;
              foundCarcass = true;

              if (dist < org.sizePx + pellet.radius) {
                org.energy = Math.min(org.maxEnergy, org.energy + 30);
                pellet.decayTime -= 8;
                this.callbacks.onAudioEvent?.('eat');
                this.addConsumptionEffect(pellet.x, pellet.y, 'scavenge');
              }
            }
          }
        }

        if (foundCarcass && nearestDist > 5) {
          steerX += ((targetX - org.x) / nearestDist) * 1.0;
          steerY += ((targetY - org.y) / nearestDist) * 1.0;
        }
      }
    }

    // 3. Mating / Reproduction
    if (org.energy > org.maxEnergy * 0.75 && org.reproductionCooldown <= 0 && org.trophicLevel !== 'producer') {
      // Find mate of same species
      const mates = (org.trophicLevel === 'herbivore' ? herbivores : org.trophicLevel === 'predator' ? predators : decomposers)
        .filter((m) => m.id !== org.id && m.speciesId === org.speciesId && m.reproductionCooldown <= 0 && m.energy > m.maxEnergy * 0.6);

      if (mates.length > 0) {
        const mate = mates[0];
        const dist = Math.hypot(mate.x - org.x, mate.y - org.y);
        if (dist < 150) {
          steerX += ((mate.x - org.x) / dist) * 1.2;
          steerY += ((mate.y - org.y) / dist) * 1.2;
          org.state = 'mating';

          if (dist < org.sizePx + mate.sizePx + 5) {
            // Mating Successful!
            const childGenome = crossoverGenomes(org.genome, mate.genome, env);
            const childGen = Math.max(org.generation, mate.generation) + 1;
            const child = this.spawnOrganism(
              org.speciesId,
              (org.x + mate.x) / 2,
              (org.y + mate.y) / 2,
              childGen,
              childGenome,
              [org.id, mate.id]
            );

            if (child) {
              org.energy *= 0.55;
              mate.energy *= 0.55;
              org.reproductionCooldown = 20 + Math.random() * 10;
              mate.reproductionCooldown = 20 + Math.random() * 10;
              this.callbacks.onAudioEvent?.('reproduce');
            }
          }
        }
      } else if (
        occursDuringInterval(EcosystemEngine.ASEXUAL_BUDDING_RATE, dt) &&
        this.organisms.length < EcosystemEngine.MAX_ORGANISMS
      ) {
        // Asexual budding when isolated with high energy
        const childGenome = mutateGenome(org.genome, env);
        this.spawnOrganism(org.speciesId, org.x + 10, org.y + 10, org.generation + 1, childGenome, [org.id]);
        org.energy *= 0.6;
        org.reproductionCooldown = 25;
        this.callbacks.onAudioEvent?.('reproduce');
      }
    }

    // 4. Boids Alignment & Cohesion (Wandering gently)
    if (org.state === 'wandering') {
      const wanderNoiseX = (Math.random() - 0.5) * 0.6;
      const wanderNoiseY = (Math.random() - 0.5) * 0.6;
      steerX += wanderNoiseX;
      steerY += wanderNoiseY;
    }

    // Apply acceleration and cap speed
    org.vx = (org.vx * 0.95) + steerX * 0.15;
    org.vy = (org.vy * 0.95) + steerY * 0.15;

    const currentSpeed = Math.hypot(org.vx, org.vy);
    // Moisture is the medium for this micro ecosystem: a dry bottle slows
    // swimming and a familiar moisture range keeps movement lively. The lower
    // bound avoids immobilising organisms entirely at extreme settings.
    const moistureFit = Math.max(0, 1 - Math.abs(env.moisture - org.genome.moistOpt) / 120);
    const maxSpeed = org.genome.speed * (0.85 + moistureFit * 0.65);
    if (currentSpeed > maxSpeed) {
      org.vx = (org.vx / currentSpeed) * maxSpeed;
      org.vy = (org.vy / currentSpeed) * maxSpeed;
    }

    if (currentSpeed > 0.1) {
      org.angle = Math.atan2(org.vy, org.vx);
    }
  }

  private handleTerrariumBoundaries(org: Organism) {
    const { minX, maxX, minY, maxY } = this.getOrganismBounds(org);

    if (org.x < minX) {
      org.x = minX;
      org.vx = Math.abs(org.vx) * 0.8;
    } else if (org.x > maxX) {
      org.x = maxX;
      org.vx = -Math.abs(org.vx) * 0.8;
    }

    if (org.y < minY) {
      org.y = minY;
      org.vy = Math.abs(org.vy) * 0.8;
    } else if (org.y > maxY) {
      org.y = maxY;
      org.vy = -Math.abs(org.vy) * 0.8;
    }
  }

  private remapCoordinate(value: number, previousMin: number, previousMax: number, nextMin: number, nextMax: number) {
    const previousSpan = Math.max(1, previousMax - previousMin);
    const nextSpan = Math.max(0, nextMax - nextMin);
    const ratio = Math.min(1, Math.max(0, (value - previousMin) / previousSpan));
    return nextMin + ratio * nextSpan;
  }

  private getOrganismBounds(org: Organism) {
    const minX = this.bounds.paddingX + org.sizePx;
    const maxX = Math.max(minX, this.bounds.width - this.bounds.paddingX - org.sizePx);
    const minY = this.bounds.paddingY + org.sizePx;
    const maxY = Math.max(minY, this.bounds.height - this.bounds.paddingY - org.sizePx);
    return { minX, maxX, minY, maxY };
  }

  private clampOrganismToBounds(org: Organism) {
    const { minX, maxX, minY, maxY } = this.getOrganismBounds(org);
    org.x = Math.min(maxX, Math.max(minX, org.x));
    org.y = Math.min(maxY, Math.max(minY, org.y));
  }

  private killOrganism(org: Organism): boolean {
    if (org.isDead) return false;
    org.isDead = true;
    this.totalDeadCount++;
    this.callbacks.onAudioEvent?.('death');

    this.addFoodPellet('carcass', org.x, org.y, org.genome.size * 30, false);
    return true;
  }

  private addConsumptionEffect(x: number, y: number, kind: ConsumptionEffect['kind']) {
    if (this.consumptionEffects.length >= EcosystemEngine.MAX_CONSUMPTION_EFFECTS) {
      this.consumptionEffects.shift();
    }
    this.consumptionEffects.push({
      x,
      y,
      kind,
      duration: kind === 'hunt' ? 0.72 : 0.52,
      elapsed: 0,
      seed: Math.floor(Math.random() * 0x7fffffff),
    });
  }

  public getStats(): EcosystemStats {
    let pCount = 0;
    let cCount = 0;
    let hCount = 0;
    let dCount = 0;
    const speciesCounts: Record<string, number> = {};

    for (const org of this.organisms) {
      if (org.isDead) continue;
      speciesCounts[org.speciesId] = (speciesCounts[org.speciesId] || 0) + 1;
      if (org.trophicLevel === 'producer') pCount++;
      else if (org.trophicLevel === 'herbivore') cCount++;
      else if (org.trophicLevel === 'predator') hCount++;
      else if (org.trophicLevel === 'decomposer') dCount++;
    }

    const unlockedSpeciesCount = this.speciesList.filter((s) => s.unlocked).length;
    const biodiversityIndex = calculateShannonIndex(speciesCounts);
    const { health, harmonyScore } = calculateEcosystemScores(
      pCount,
      cCount,
      hCount,
      dCount,
      biodiversityIndex,
      unlockedSpeciesCount
    );

    return {
      totalOrganisms: this.organisms.length,
      producerCount: pCount,
      herbivoreCount: cCount,
      predatorCount: hCount,
      decomposerCount: dCount,
      unlockedSpeciesCount,
      biodiversityIndex,
      ecosystemHealth: health,
      bioHarmonyScore: harmonyScore,
      simulationAgeSeconds: Math.round(this.totalSimAge),
      generationRecord: this.generationRecord,
      extinctionCount: this.totalDeadCount,
    };
  }
}
