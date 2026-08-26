import { describe, expect, it } from 'vitest';
import { getEcosystemAdvice, getEnvironmentReading } from '../features/ecosystem/domain/ecosystemGuidance';
import type {
  EcosystemAdviceId,
  EnvironmentReadingId,
} from '../features/ecosystem/domain/ecosystemGuidance';
import { LOCALES, MESSAGES } from '../features/i18n';
import { EcosystemStats, EnvironmentState } from '../shared/kernel';

const env: EnvironmentState = {
  sunlight: 65, moisture: 60, temperature: 22, nutrients: 55, dayNightCycle: 0.2, autoDayNight: true, timeSpeed: 1,
};

const stats: EcosystemStats = {
  totalOrganisms: 24, producerCount: 12, herbivoreCount: 6, predatorCount: 2, decomposerCount: 4,
  unlockedSpeciesCount: 4, biodiversityIndex: 1.2, ecosystemHealth: 82, bioHarmonyScore: 400,
  simulationAgeSeconds: 12, generationRecord: 1, extinctionCount: 0,
};

describe('ecosystem guidance', () => {
  it('marks extreme environment controls as danger states', () => {
    expect(getEnvironmentReading('sunlight', { ...env, sunlight: 95 }).tone).toBe('danger');
    expect(getEnvironmentReading('moisture', { ...env, moisture: 20 }).id).toBe('moisture.low');
    expect(getEnvironmentReading('temperature', { ...env, temperature: 40 }).id).toBe('temperature.hot');
  });

  it('prioritizes recovering a critically unhealthy ecosystem over experimentation', () => {
    const advice = getEcosystemAdvice({ ...env, sunlight: 95 }, { ...stats, ecosystemHealth: 20 });
    expect(advice.tone).toBe('danger');
    expect(advice.id).toBe('recover');
  });

  it('encourages observation when the environment and ecosystem are stable', () => {
    const advice = getEcosystemAdvice(env, stats);
    expect(advice.tone).toBe('balanced');
    expect(advice.id).toBe('observe');
  });

  it('exposes every guidance id in all three language catalogues', () => {
    const readingIds: EnvironmentReadingId[] = [
      'sunlight.low', 'sunlight.high', 'sunlight.balanced',
      'moisture.low', 'moisture.high', 'moisture.balanced',
      'temperature.cold', 'temperature.hot', 'temperature.pressure', 'temperature.balanced',
    ];
    const adviceIds: EcosystemAdviceId[] = [
      'recover', 'temperature', 'moisture.low', 'moisture.high',
      'sunlight.low', 'sunlight.high', 'diversity', 'observe',
    ];

    for (const locale of LOCALES) {
      for (const id of readingIds) {
        expect(MESSAGES[locale].advisor.readings[id].label).toBeTruthy();
      }
      for (const id of adviceIds) {
        expect(MESSAGES[locale].advisor.advice[id].title).toBeTruthy();
      }
    }
  });
});
