import { afterEach, describe, expect, it, vi } from 'vitest';
import { EcosystemEngine, occursDuringInterval } from '../features/ecosystem';
import { HiveEcosystemDNA } from '../shared/kernel';

const restoredDNA: HiveEcosystemDNA = {
  version: '1.1.0',
  creatorName: '테스트',
  terrariumName: '복원 테스트',
  timestamp: 1,
  env: {
    sunlight: 85,
    moisture: 70,
    temperature: 30,
    nutrients: 80,
    dayNightCycle: 0.25,
    autoDayNight: true,
    timeSpeed: 1,
  },
  customization: {
    bottleShape: 'classic-jar',
    substrate: 'moss-forest',
    background: 'cozy-lab',
  },
  speciesUnlocked: ['lumi_flora', 'jelly_wiggle', 'phantom_lip', 'mycel_linker', 'aurora_fin'],
  stats: { totalAge: 42, highestScore: 400, discoveredCount: 5 },
  organisms: [
    {
      speciesId: 'aurora_fin',
      generation: 4,
      customName: '무지개',
      genome: {
        size: 1.5,
        speed: 1.5,
        metabolism: 0.9,
        tempOpt: 28,
        tempTol: 10,
        moistOpt: 75,
        hue: 280,
        mutationRate: 0.3,
        defense: 0.4,
        bioluminescence: 1,
      },
    },
  ],
};

const playableEnv = {
  sunlight: 65,
  moisture: 60,
  temperature: 22,
  nutrients: 55,
  dayNightCycle: 0.2,
  autoDayNight: true,
  timeSpeed: 1,
} as const;

describe('EcosystemEngine restoration and invariants', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses a frame-rate-independent probability for time-based events', () => {
    const rate = 0.3;
    const oneSecondProbability = 1 - Math.exp(-rate);
    const sixtyFrameProbability = 1 - Math.pow(1 - (1 - Math.exp(-rate / 60)), 60);

    expect(sixtyFrameProbability).toBeCloseTo(oneSecondProbability, 12);
    expect(occursDuringInterval(rate, 1, () => oneSecondProbability - 0.001)).toBe(true);
    expect(occursDuringInterval(rate, 1, () => oneSecondProbability + 0.001)).toBe(false);
  });
  it('restores unlocked species, population genomes, names, and generation records', () => {
    const engine = new EcosystemEngine();
    engine.restoreFromDNA(restoredDNA);

    expect(engine.organisms).toHaveLength(1);
    expect(engine.organisms[0]).toMatchObject({
      speciesId: 'aurora_fin',
      customName: '무지개',
      generation: 4,
      genome: restoredDNA.organisms[0].genome,
    });
    expect(engine.speciesList.find((species) => species.id === 'aurora_fin')?.unlocked).toBe(true);
    expect(engine.speciesList.find((species) => species.id === 'cosmic_plankton')?.unlocked).toBe(false);
    expect(engine.speciesList.find((species) => species.id === 'prism_amoeba')?.unlocked).toBe(false);
    expect(engine.getStats().simulationAgeSeconds).toBe(42);
    expect(engine.getStats().generationRecord).toBe(4);
  });

  it('keeps spawned energy within each organism maximum energy', () => {
    const engine = new EcosystemEngine();
    const organism = engine.spawnOrganism('jelly_wiggle', 100, 100, 1, {
      ...restoredDNA.organisms[0].genome,
      size: 0.5,
    });

    expect(organism?.energy).toBeLessThanOrEqual(organism?.maxEnergy ?? 0);
  });

  it('preserves the population spread when the canvas bounds are resized', () => {
    const engine = new EcosystemEngine();
    const organisms = engine.organisms.slice(0, 3);
    const startingX = [100, 400, 700];
    organisms.forEach((organism, index) => {
      organism.x = startingX[index];
      organism.y = 300;
    });
    engine.organisms = organisms;

    engine.resizeBounds(400, 500, 40, 40);

    const xPositions = engine.organisms.map((organism) => organism.x);
    expect(Math.min(...xPositions)).toBeGreaterThanOrEqual(40);
    expect(Math.max(...xPositions)).toBeLessThanOrEqual(360);
    expect(Math.max(...xPositions) - Math.min(...xPositions)).toBeGreaterThan(240);
  });

  it('enforces the population cap under repeated spawning', () => {
    const engine = new EcosystemEngine();
    for (let index = engine.organisms.length; index < 120; index++) {
      engine.spawnOrganism('lumi_flora');
    }
    expect(engine.organisms.length).toBe(100);
    expect(engine.spawnOrganism('lumi_flora')).toBeNull();
  });

  it('does not advance simulation state while the player has paused time', () => {
    const engine = new EcosystemEngine();
    const organism = engine.organisms[0];
    const before = { age: organism.age, energy: organism.energy, x: organism.x, y: organism.y };

    engine.update(5, { ...playableEnv, timeSpeed: 0 });

    expect(engine.totalSimAge).toBe(0);
    expect(organism).toMatchObject(before);
  });

  it('advances an active organism in the water medium', () => {
    const engine = new EcosystemEngine();
    const organism = engine.organisms.find((candidate) => candidate.trophicLevel === 'producer')!;
    engine.organisms = [organism];
    engine.foodPellets = [];
    organism.x = 400;
    organism.y = 300;
    organism.vx = 1;
    organism.vy = 0;

    engine.update(0.1, playableEnv);

    expect(organism.x).not.toBe(400);
    expect(organism.x).toBeGreaterThan(400);
  });

  it('lets nutrients strengthen producer recovery without exceeding its energy cap', () => {
    const lowNutrientEngine = new EcosystemEngine();
    const highNutrientEngine = new EcosystemEngine();
    const lowNutrientProducer = lowNutrientEngine.organisms.find((candidate) => candidate.trophicLevel === 'producer')!;
    const highNutrientProducer = highNutrientEngine.organisms.find((candidate) => candidate.trophicLevel === 'producer')!;

    lowNutrientEngine.organisms = [lowNutrientProducer];
    highNutrientEngine.organisms = [highNutrientProducer];
    lowNutrientEngine.foodPellets = [];
    highNutrientEngine.foodPellets = [];
    lowNutrientProducer.energy = 40;
    highNutrientProducer.energy = 40;

    lowNutrientEngine.update(0.1, { ...playableEnv, nutrients: 0 });
    highNutrientEngine.update(0.1, { ...playableEnv, nutrients: 100 });

    expect(highNutrientProducer.energy).toBeGreaterThan(lowNutrientProducer.energy);
    expect(highNutrientProducer.energy).toBeLessThanOrEqual(highNutrientProducer.maxEnergy);
  });

  it('clears prior temperature history when a preset reseeds the ecosystem', () => {
    const engine = new EcosystemEngine();
    engine.prevTemp = -10;
    engine.seedInitialEcosystem();

    engine.update(0.1, playableEnv);

    expect(engine.tempShockDetected).toBe(false);
  });

  it('lets a hungry herbivore consume a player-dropped nutrient pellet', () => {
    const engine = new EcosystemEngine();
    const herbivore = engine.organisms.find((organism) => organism.trophicLevel === 'herbivore')!;
    engine.organisms = [herbivore];
    engine.foodPellets = [];
    herbivore.x = 400;
    herbivore.y = 300;
    herbivore.energy = 10;
    engine.addFoodPellet('nutrient', herbivore.x, herbivore.y, 35, false);

    engine.update(0.1, playableEnv);

    expect(herbivore.energy).toBeGreaterThan(40);
    expect(engine.foodPellets[0].decayTime).toBe(0);
    expect(engine.consumptionEffects).toHaveLength(1);
    expect(engine.consumptionEffects[0].kind).toBe('graze');
    expect(Number.isFinite(engine.consumptionEffects[0].x)).toBe(true);
    expect(Number.isFinite(engine.consumptionEffects[0].y)).toBe(true);
  });

  it('expires short-lived consumption effects and bounds their retained count', () => {
    const engine = new EcosystemEngine();
    const herbivore = engine.organisms.find((organism) => organism.trophicLevel === 'herbivore')!;
    engine.organisms = [herbivore];
    engine.foodPellets = [];
    herbivore.x = 400;
    herbivore.y = 300;
    herbivore.energy = 10;
    engine.addFoodPellet('nutrient', herbivore.x, herbivore.y, 35, false);

    engine.update(0.1, playableEnv);
    expect(engine.consumptionEffects).toHaveLength(1);

    for (let tick = 0; tick < 6; tick++) {
      engine.update(0.1, playableEnv);
    }
    expect(engine.consumptionEffects).toHaveLength(0);
  });

  it('mutates a hungry herbivore after it consumes a player-dropped mutagen', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8);
    const engine = new EcosystemEngine();
    const herbivore = engine.organisms.find((organism) => organism.trophicLevel === 'herbivore')!;
    engine.organisms = [herbivore];
    engine.foodPellets = [];
    herbivore.x = 400;
    herbivore.y = 300;
    herbivore.energy = 10;
    const beforeGenome = { ...herbivore.genome };
    engine.addFoodPellet('mutagen', herbivore.x, herbivore.y, 50, false);

    engine.update(0.1, playableEnv);

    expect(herbivore.genome).not.toEqual(beforeGenome);
    expect(engine.foodPellets[0].decayTime).toBe(0);
  });

  it('creates and advances a knock shockwave without leaving it permanently active', () => {
    const engine = new EcosystemEngine();
    engine.tapGlass(400, 300);

    expect(engine.shockwaves).toHaveLength(1);
    engine.update(0.1, playableEnv);
    expect(engine.shockwaves[0].radius).toBeGreaterThan(5);
    for (let tick = 0; tick < 8; tick++) {
      engine.update(0.1, playableEnv);
    }
    expect(engine.shockwaves).toHaveLength(0);
  });

  it('keeps a normal unattended terrarium bounded and recoverable over time', () => {
    const engine = new EcosystemEngine();
    for (let tick = 0; tick < 1200; tick++) {
      engine.update(0.1, playableEnv);
    }

    const stats = engine.getStats();
    expect(stats.totalOrganisms).toBeGreaterThan(0);
    expect(stats.totalOrganisms).toBeLessThanOrEqual(100);
    expect(stats.producerCount).toBeGreaterThan(0);
    expect(Object.values(stats).filter((value) => typeof value === 'number').every(Number.isFinite)).toBe(true);
  });

  it('turns every death into exactly one carcass for the decomposer cycle', () => {
    let deathEvents = 0;
    const engine = new EcosystemEngine({
      onAudioEvent: (event) => {
        if (event === 'death') deathEvents++;
      },
    });
    const prey = engine.organisms.find((organism) => organism.trophicLevel === 'herbivore')!;
    const killOrganism = (engine as unknown as { killOrganism: (organism: typeof prey) => boolean }).killOrganism.bind(engine);

    expect(killOrganism(prey)).toBe(true);
    expect(killOrganism(prey)).toBe(false);
    expect(deathEvents).toBe(1);
    expect(engine.foodPellets.some((pellet) => pellet.type === 'carcass')).toBe(true);

    const producer = engine.organisms.find((organism) => organism.trophicLevel === 'producer')!;
    expect(killOrganism(producer)).toBe(true);
    expect(engine.foodPellets.filter((pellet) => pellet.type === 'carcass')).toHaveLength(2);
  });

  it('returns to the pristine first-launch state on reset', () => {
    const engine = new EcosystemEngine();
    const pristineUnlocked = engine.speciesList
      .filter((species) => species.unlocked)
      .map((species) => species.id)
      .sort();
    const pristinePopulation = engine.organisms.length;

    for (let step = 0; step < 300; step++) engine.update(0.1, playableEnv);
    const stillLocked = engine.speciesList.find((species) => !species.unlocked);
    expect(stillLocked).toBeDefined();
    stillLocked!.unlocked = true;

    engine.reset();

    expect(
      engine.speciesList
        .filter((species) => species.unlocked)
        .map((species) => species.id)
        .sort()
    ).toEqual(pristineUnlocked);
    expect(engine.organisms).toHaveLength(pristinePopulation);
    expect(engine.totalSimAge).toBe(0);
    expect(engine.totalDeadCount).toBe(0);
    expect(engine.generationRecord).toBe(1);
    expect(engine.history).toHaveLength(0);
    expect(engine.getStats().unlockedSpeciesCount).toBe(pristineUnlocked.length);
  });

  it('keeps simulating normally after a reset', () => {
    const engine = new EcosystemEngine();
    for (let step = 0; step < 100; step++) engine.update(0.1, playableEnv);

    engine.reset();

    expect(() => {
      for (let step = 0; step < 100; step++) engine.update(0.1, playableEnv);
    }).not.toThrow();
    expect(engine.getStats().totalOrganisms).toBeGreaterThan(0);
  });
});

// 심사위원 퀵투어 "돌연변이 가속" 프리셋과 같은 환경.
const mutationBurstEnv = {
  sunlight: 85,
  moisture: 75,
  temperature: 36,
  nutrients: 80,
  dayNightCycle: 0.2,
  autoDayNight: false,
  timeSpeed: 2,
} as const;

describe('mutation burst preset speciation', () => {
  it('picks a species that the current environment can actually unlock', () => {
    const engine = new EcosystemEngine();
    const target = engine.primeSpeciation(mutationBurstEnv);

    expect(target).not.toBeNull();
    expect(target!.unlocked).toBe(false);
    expect(target!.spawnConditions.specialCondition).toBeUndefined();

    const cond = target!.spawnConditions;
    if (cond.minTemp !== undefined) expect(mutationBurstEnv.temperature).toBeGreaterThanOrEqual(cond.minTemp);
    if (cond.minSun !== undefined) expect(mutationBurstEnv.sunlight).toBeGreaterThanOrEqual(cond.minSun);
    if (cond.minMoist !== undefined) expect(mutationBurstEnv.moisture).toBeGreaterThanOrEqual(cond.minMoist);

    // 부모 종은 이미 해금돼 있어야 무대에서 유리병에 실제로 존재한다.
    const parent = engine.speciesList.find((sp) => sp.id === cond.parentSpeciesId);
    expect(parent?.unlocked).toBe(true);
  });

  it('unlocks a new species within 5 seconds on every run', () => {
    const RUNS = 100;
    const OBSERVE_SECONDS = 5;

    for (let run = 0; run < RUNS; run++) {
      let unlockedDuringDemo = 0;
      const engine = new EcosystemEngine({ onSpeciesUnlocked: () => (unlockedDuringDemo += 1) });
      engine.primeSpeciation(mutationBurstEnv);

      for (let frame = 0; frame < OBSERVE_SECONDS * 60 && unlockedDuringDemo === 0; frame++) {
        engine.update(1 / 60, mutationBurstEnv);
      }

      expect(unlockedDuringDemo).toBeGreaterThan(0);
    }
  }, 20000);

  it('leaves the speciation rule itself untouched', () => {
    // primeSpeciation은 개체만 준비한다 — 해금은 update의 종분화 판정이 한다.
    const engine = new EcosystemEngine();
    const before = engine.speciesList.filter((sp) => sp.unlocked).length;
    engine.primeSpeciation(mutationBurstEnv);
    expect(engine.speciesList.filter((sp) => sp.unlocked).length).toBe(before);
  });
});
