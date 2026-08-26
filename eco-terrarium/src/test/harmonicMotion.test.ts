import { describe, expect, it } from 'vitest';
import {
  breathingScalar,
  clamp,
  radialPulseWave,
  travelingSpineWave,
} from '../features/ecosystem/domain/harmonicMotion';

describe('clamp', () => {
  it('bounds values and treats NaN as the lower bound', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, 0, 3)).toBe(0);
    expect(clamp(1.5, 0, 3)).toBe(1.5);
    expect(clamp(Number.NaN, 2, 3)).toBe(2);
  });
});

describe('radialPulseWave', () => {
  it('decays exponentially with distance', () => {
    const params = { frequency: 1, waveNumber: 0, damping: 0.3 };
    const near = Math.abs(radialPulseWave(1, Math.PI / 2, params));
    const far = Math.abs(radialPulseWave(4, Math.PI / 2, params));
    expect(far).toBeLessThan(near);
    expect(far).toBeCloseTo(Math.exp(-1.2), 6);
  });

  it('treats negative distances as the origin', () => {
    const params = { frequency: 3, waveNumber: 2, damping: 0.4 };
    expect(radialPulseWave(-5, 1, params)).toBeCloseTo(radialPulseWave(0, 1, params), 10);
  });
});

describe('travelingSpineWave', () => {
  it('delays the phase of later segments and pins both ends', () => {
    const head = travelingSpineWave(0, 2, 4, 3);
    const tail = travelingSpineWave(1, 2, 4, 3);
    expect(tail.phase).toBeLessThan(head.phase);
    expect(travelingSpineWave(0, 1.3, 5, 6).offset).toBeCloseTo(0, 10);
    expect(travelingSpineWave(1, 1.3, 5, 6).offset).toBeCloseTo(0, 10);
  });

  it('returns a unit normal and clamps progress', () => {
    const sample = travelingSpineWave(0.4, 1.1, 3, 5);
    expect(Math.hypot(sample.normalX, sample.normalY)).toBeCloseTo(1, 10);
    expect(travelingSpineWave(-2, 1, 3, 5)).toEqual(travelingSpineWave(0, 1, 3, 5));
    expect(travelingSpineWave(9, 1, 3, 5)).toEqual(travelingSpineWave(1, 1, 3, 5));
  });
});

describe('breathingScalar', () => {
  it('stays in [-1, 1] and repeats every 2π', () => {
    for (let time = 0; time < 20; time += 0.31) {
      const value = breathingScalar(time);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
      expect(value).toBeCloseTo(breathingScalar(time + Math.PI * 2), 10);
    }
  });
});
