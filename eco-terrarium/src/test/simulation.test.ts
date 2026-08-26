import { describe, it, expect } from 'vitest';
import {
  getEnvironmentalGrowthMultiplier,
  getTemperatureMortalityStress,
  rk4Step,
  calculateShannonIndex,
  calculateEcosystemScores,
} from '../features/ecosystem';
import { EnvironmentState } from '../shared/kernel';

describe('Lotka-Volterra Simulation Engine', () => {
  const sampleEnv: EnvironmentState = {
    sunlight: 65,
    moisture: 60,
    temperature: 22,
    nutrients: 50,
    dayNightCycle: 0.2,
    autoDayNight: true,
    timeSpeed: 1,
  };

  it('calculates optimal environmental multiplier near 22°C and 65% sunlight', () => {
    const mult = getEnvironmentalGrowthMultiplier(sampleEnv);
    expect(mult).toBeGreaterThan(0.5);
    expect(mult).toBeLessThan(2.0);
  });

  it('increases temperature mortality stress in freezing (< 5°C) and hot (> 32°C) conditions', () => {
    expect(getTemperatureMortalityStress(22)).toBe(1.0);
    expect(getTemperatureMortalityStress(-5)).toBeGreaterThan(1.0);
    expect(getTemperatureMortalityStress(40)).toBeGreaterThan(1.0);
  });

  it('computes 4th-order Runge-Kutta numerical integration step without NaN or negative counts', () => {
    const initialState = {
      producers: 20,
      herbivores: 10,
      predators: 3,
      decomposers: 5,
      nutrients: 50,
    };

    const next = rk4Step(initialState, sampleEnv, 0.1);
    expect(next.producers).toBeGreaterThan(0);
    expect(next.herbivores).toBeGreaterThan(0);
    expect(next.predators).toBeGreaterThan(0);
    expect(next.decomposers).toBeGreaterThan(0);
    expect(Number.isFinite(next.nutrients)).toBe(true);
  });

  it('computes Shannon-Wiener Biodiversity Index correctly', () => {
    const counts = {
      lumi_flora: 10,
      jelly_wiggle: 10,
      phantom_lip: 10,
      mycel_linker: 10,
    };
    const index = calculateShannonIndex(counts);
    expect(index).toBeCloseTo(1.39, 1);
  });

  it('computes realistic ecosystem health and harmony scores', () => {
    const { health, harmonyScore } = calculateEcosystemScores(20, 10, 3, 5, 1.4, 6);
    expect(health).toBeGreaterThan(60);
    expect(health).toBeLessThanOrEqual(100);
    expect(harmonyScore).toBeGreaterThan(300);
    expect(harmonyScore).toBeLessThanOrEqual(1000);
  });
});
