import { describe, it, expect } from 'vitest';
import { mutateGenome, crossoverGenomes, checkSpeciation, INITIAL_SPECIES_DATABASE } from '../features/ecosystem';
import { Genome, EnvironmentState } from '../shared/kernel';

describe('Genetics & Evolution System', () => {
  const baseGenome: Genome = {
    size: 1.0,
    speed: 1.0,
    metabolism: 1.0,
    tempOpt: 22,
    tempTol: 10,
    moistOpt: 60,
    hue: 120,
    mutationRate: 0.15,
    defense: 0.2,
    bioluminescence: 0.7,
  };

  const env: EnvironmentState = {
    sunlight: 85,
    moisture: 80,
    temperature: 36,
    nutrients: 70,
    dayNightCycle: 0.2,
    autoDayNight: true,
    timeSpeed: 1,
  };

  it('mutates genome within valid biological boundaries', () => {
    const mutated = mutateGenome(baseGenome, env);
    expect(mutated.size).toBeGreaterThanOrEqual(0.5);
    expect(mutated.size).toBeLessThanOrEqual(2.5);
    expect(mutated.speed).toBeGreaterThanOrEqual(0.4);
    expect(mutated.defense).toBeGreaterThanOrEqual(0);
    expect(mutated.defense).toBeLessThanOrEqual(1.0);
  });

  it('crossovers two parent genomes properly', () => {
    const g2: Genome = { ...baseGenome, size: 2.0, speed: 2.5, defense: 0.8 };
    const child = crossoverGenomes(baseGenome, g2, env);
    expect(child).toBeDefined();
    expect(Number.isFinite(child.size)).toBe(true);
    expect(Number.isFinite(child.speed)).toBe(true);
  });

  it('triggers speciation when conditions are satisfied', () => {
    // Solar bloom conditions: minSun 80, minTemp 25, parent lumi_flora
    const solarCandidate = checkSpeciation(
      'lumi_flora',
      { ...baseGenome, size: 1.6, tempOpt: 32 },
      env,
      INITIAL_SPECIES_DATABASE
    );
    expect(solarCandidate).toBeDefined();
    expect(solarCandidate?.id).toBe('solar_bloom');
  });
});

describe('checkSpeciation skips species that are already discovered', () => {
  it('reaches a locked species even when an unlocked one matches first', () => {
    const speciesList = INITIAL_SPECIES_DATABASE.map((sp) => ({ ...sp, spawnConditions: { ...sp.spawnConditions } }));
    const glowTail = speciesList.find((sp) => sp.id === 'glow_tail')!;
    const env = {
      sunlight: 85,
      moisture: 75,
      temperature: 36,
      nutrients: 80,
      dayNightCycle: 0.2,
      autoDayNight: false,
      timeSpeed: 2,
    };

    // 글로우 테일 문턱까지 표류한 젤리 위글. 목록 앞자리의 해금된 종들이
    // 가로채면 이 개체는 영원히 신종이 되지 못한다.
    const result = checkSpeciation('jelly_wiggle', { ...glowTail.baseGenome }, env, speciesList);

    expect(result).not.toBeNull();
    expect(result!.unlocked).toBe(false);
    expect(result!.id).toBe('glow_tail');
  });

  it('never returns an already unlocked species', () => {
    const speciesList = INITIAL_SPECIES_DATABASE.map((sp) => ({ ...sp, spawnConditions: { ...sp.spawnConditions } }));
    const env = {
      sunlight: 70,
      moisture: 70,
      temperature: 24,
      nutrients: 70,
      dayNightCycle: 0.25,
      autoDayNight: true,
      timeSpeed: 1,
    };

    for (const source of speciesList) {
      const result = checkSpeciation(source.id, { ...source.baseGenome }, env, speciesList);
      if (result) expect(result.unlocked).toBe(false);
    }
  });
});
