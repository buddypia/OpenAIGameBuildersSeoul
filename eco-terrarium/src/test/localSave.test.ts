import { describe, expect, it } from 'vitest';
import {
  clearEcosystemLocally,
  loadEcosystemLocally,
  LOCAL_SAVE_KEY,
  saveEcosystemLocally,
  type SaveStorage,
} from '../features/hive';
import { EcosystemEngine } from '../features/ecosystem';
import { EnvironmentState, HiveEcosystemDNA } from '../shared/kernel/types';

/** Minimal in-memory Storage stand-in; the suite runs in Node, without a DOM. */
function createMemoryStorage(): SaveStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

function createThrowingStorage(): SaveStorage {
  return {
    getItem: () => {
      throw new Error('storage disabled');
    },
    setItem: () => {
      throw new Error('quota exceeded');
    },
    removeItem: () => {
      throw new Error('storage disabled');
    },
  };
}

const SAMPLE_DNA: HiveEcosystemDNA = {
  version: '1.1.0',
  creatorName: '생태계 지휘자',
  terrariumName: '테스트 테라리움',
  timestamp: 1_700_000_000_000,
  env: {
    sunlight: 65,
    moisture: 60,
    temperature: 22,
    nutrients: 55,
    dayNightCycle: 0.2,
    autoDayNight: true,
    timeSpeed: 1,
  },
  customization: {
    bottleShape: 'classic-jar',
    substrate: 'moss-forest',
    background: 'cozy-lab',
  },
  speciesUnlocked: ['lumi_flora', 'jelly_wiggle'],
  stats: { totalAge: 128, highestScore: 74, discoveredCount: 2 },
  organisms: [
    {
      speciesId: 'lumi_flora',
      genome: {
        size: 1,
        speed: 0.8,
        metabolism: 1.1,
        tempOpt: 22,
        tempTol: 8,
        moistOpt: 60,
        hue: 120,
        mutationRate: 0.1,
        defense: 0.2,
        bioluminescence: 0.5,
      },
      generation: 3,
      customName: '첫 번째 잎',
    },
  ],
};

describe('local ecosystem save', () => {
  it('round-trips a terrarium and its quest progress', () => {
    const storage = createMemoryStorage();

    const saved = saveEcosystemLocally(
      { dna: SAMPLE_DNA, completedQuestIds: ['q1', 'q3'], savedAt: 1_700_000_001_000 },
      storage
    );
    expect(saved).toBe(true);

    const restored = loadEcosystemLocally(storage);
    expect(restored).not.toBeNull();
    expect(restored?.completedQuestIds).toEqual(['q1', 'q3']);
    expect(restored?.savedAt).toBe(1_700_000_001_000);
    expect(restored?.dna.terrariumName).toBe('테스트 테라리움');
    expect(restored?.dna.env.temperature).toBe(22);
    expect(restored?.dna.organisms).toHaveLength(1);
    expect(restored?.dna.organisms[0].customName).toBe('첫 번째 잎');
    expect(restored?.dna.speciesUnlocked).toEqual(['lumi_flora', 'jelly_wiggle']);
  });

  it('stores the ecosystem compressed rather than as readable JSON', () => {
    const storage = createMemoryStorage();
    saveEcosystemLocally({ dna: SAMPLE_DNA, completedQuestIds: [], savedAt: 1 }, storage);

    const raw = storage.map.get(LOCAL_SAVE_KEY) ?? '';
    expect(raw).not.toContain('테스트 테라리움');
    expect(raw).not.toContain('lumi_flora');
    expect(raw).toContain('"v":1');
  });

  it('returns null when nothing has been saved yet', () => {
    expect(loadEcosystemLocally(createMemoryStorage())).toBeNull();
  });

  it('discards a corrupted payload instead of surfacing it', () => {
    const storage = createMemoryStorage();
    storage.map.set(LOCAL_SAVE_KEY, '{ not valid json');

    expect(loadEcosystemLocally(storage)).toBeNull();
    expect(storage.map.has(LOCAL_SAVE_KEY)).toBe(false);
  });

  it('discards an envelope from an unknown save version', () => {
    const storage = createMemoryStorage();
    storage.map.set(LOCAL_SAVE_KEY, JSON.stringify({ v: 99, dna: 'x', quests: [], savedAt: 1 }));

    expect(loadEcosystemLocally(storage)).toBeNull();
    expect(storage.map.has(LOCAL_SAVE_KEY)).toBe(false);
  });

  it('discards an envelope whose ecosystem body fails to decode', () => {
    const storage = createMemoryStorage();
    storage.map.set(
      LOCAL_SAVE_KEY,
      JSON.stringify({ v: 1, dna: 'not-a-compressed-ecosystem', quests: [], savedAt: 1 })
    );

    expect(loadEcosystemLocally(storage)).toBeNull();
    expect(storage.map.has(LOCAL_SAVE_KEY)).toBe(false);
  });

  it('clears an existing save', () => {
    const storage = createMemoryStorage();
    saveEcosystemLocally({ dna: SAMPLE_DNA, completedQuestIds: [], savedAt: 1 }, storage);

    clearEcosystemLocally(storage);

    expect(loadEcosystemLocally(storage)).toBeNull();
  });

  it('degrades quietly when storage is unavailable', () => {
    expect(saveEcosystemLocally({ dna: SAMPLE_DNA, completedQuestIds: [], savedAt: 1 }, null)).toBe(
      false
    );
    expect(loadEcosystemLocally(null)).toBeNull();
    expect(() => clearEcosystemLocally(null)).not.toThrow();
  });

  it('degrades quietly when storage throws, so autosave cannot break the game', () => {
    const storage = createThrowingStorage();

    expect(saveEcosystemLocally({ dna: SAMPLE_DNA, completedQuestIds: [], savedAt: 1 }, storage)).toBe(
      false
    );
    expect(loadEcosystemLocally(storage)).toBeNull();
    expect(() => clearEcosystemLocally(storage)).not.toThrow();
  });
});

/**
 * Exercises the same path the app takes on autosave and on reload: a live
 * engine is snapshotted into DNA, stored, read back, and replayed into a fresh
 * engine. Unit-testing the codec alone would not catch a mismatch between what
 * the engine emits and what it accepts.
 */
describe('save and reload through the live engine', () => {
  const ENV: EnvironmentState = {
    sunlight: 70,
    moisture: 65,
    temperature: 24,
    nutrients: 60,
    dayNightCycle: 0.2,
    autoDayNight: true,
    timeSpeed: 1,
  };

  /** Mirrors the DNA payload App.tsx builds for sharing and autosave. */
  function snapshot(engine: EcosystemEngine): HiveEcosystemDNA {
    const stats = engine.getStats();
    return {
      version: '1.1.0',
      creatorName: '생태계 지휘자',
      terrariumName: '나만의 에코 테라리움',
      timestamp: 1_700_000_000_000,
      env: ENV,
      customization: {
        bottleShape: 'classic-jar',
        substrate: 'moss-forest',
        background: 'cozy-lab',
      },
      speciesUnlocked: engine.speciesList.filter((s) => s.unlocked).map((s) => s.id),
      stats: {
        totalAge: stats.simulationAgeSeconds,
        highestScore: stats.bioHarmonyScore,
        discoveredCount: stats.unlockedSpeciesCount,
      },
      organisms: engine.organisms.slice(0, 100).map((o) => ({
        speciesId: o.speciesId,
        genome: o.genome,
        generation: o.generation,
        customName: o.customName,
      })),
    };
  }

  it('restores a simulated ecosystem after a storage round trip', () => {
    const storage = createMemoryStorage();
    const original = new EcosystemEngine();

    // Let the simulation actually run so genomes and ages diverge from seed.
    for (let step = 0; step < 120; step++) original.update(1 / 60, ENV);
    original.organisms[0].customName = '이름 붙인 개체';

    const beforeCount = original.organisms.length;
    const beforeSpecies = original.organisms.map((o) => o.speciesId).sort();
    const beforeGenome = { ...original.organisms[0].genome };
    expect(beforeCount).toBeGreaterThan(0);

    saveEcosystemLocally(
      { dna: snapshot(original), completedQuestIds: ['first-bloom'], savedAt: 1 },
      storage
    );

    const restored = loadEcosystemLocally(storage);
    expect(restored).not.toBeNull();

    const revived = new EcosystemEngine();
    revived.restoreFromDNA(restored!.dna);

    expect(revived.organisms).toHaveLength(beforeCount);
    expect(revived.organisms.map((o) => o.speciesId).sort()).toEqual(beforeSpecies);
    expect(revived.organisms.some((o) => o.customName === '이름 붙인 개체')).toBe(true);
    expect(revived.organisms[0].genome).toEqual(beforeGenome);
    expect(restored!.completedQuestIds).toEqual(['first-bloom']);
  });

  it('keeps the restored ecosystem simulating without error', () => {
    const storage = createMemoryStorage();
    const original = new EcosystemEngine();
    for (let step = 0; step < 60; step++) original.update(1 / 60, ENV);

    saveEcosystemLocally({ dna: snapshot(original), completedQuestIds: [], savedAt: 1 }, storage);
    const revived = new EcosystemEngine();
    revived.restoreFromDNA(loadEcosystemLocally(storage)!.dna);

    expect(() => {
      for (let step = 0; step < 120; step++) revived.update(1 / 60, ENV);
    }).not.toThrow();
    expect(revived.getStats().totalOrganisms).toBeGreaterThan(0);
  });
});
