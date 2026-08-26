import { EcosystemStats, EnvironmentState } from '../../../shared/kernel/types';

export type EnvironmentTone = 'balanced' | 'watch' | 'danger';

/**
 * Guidance is returned as a stable id plus a tone, never as prose: the rule for
 * "when is it too hot" belongs to the domain, while the sentence that says so
 * belongs to the locale catalogue. Adding a language therefore never touches
 * this file.
 */
export type EnvironmentReadingId =
  | 'sunlight.low'
  | 'sunlight.high'
  | 'sunlight.balanced'
  | 'moisture.low'
  | 'moisture.high'
  | 'moisture.balanced'
  | 'temperature.cold'
  | 'temperature.hot'
  | 'temperature.pressure'
  | 'temperature.balanced';

export type EcosystemAdviceId =
  | 'recover'
  | 'temperature'
  | 'moisture.low'
  | 'moisture.high'
  | 'sunlight.low'
  | 'sunlight.high'
  | 'diversity'
  | 'observe';

export interface EnvironmentReading {
  id: EnvironmentReadingId;
  tone: EnvironmentTone;
}

export interface EcosystemAdvice {
  id: EcosystemAdviceId;
  tone: EnvironmentTone;
}

export const getEnvironmentReading = (
  kind: 'sunlight' | 'moisture' | 'temperature',
  env: EnvironmentState
): EnvironmentReading => {
  if (kind === 'sunlight') {
    if (env.sunlight < 30) return { id: 'sunlight.low', tone: 'watch' };
    if (env.sunlight > 88) return { id: 'sunlight.high', tone: 'danger' };
    return { id: 'sunlight.balanced', tone: 'balanced' };
  }

  if (kind === 'moisture') {
    if (env.moisture < 30) return { id: 'moisture.low', tone: 'danger' };
    if (env.moisture > 90) return { id: 'moisture.high', tone: 'danger' };
    return { id: 'moisture.balanced', tone: 'balanced' };
  }

  if (env.temperature < 5) return { id: 'temperature.cold', tone: 'danger' };
  if (env.temperature > 38) return { id: 'temperature.hot', tone: 'danger' };
  if (env.temperature < 18 || env.temperature > 27) return { id: 'temperature.pressure', tone: 'watch' };
  return { id: 'temperature.balanced', tone: 'balanced' };
};

export const getEcosystemAdvice = (env: EnvironmentState, stats: EcosystemStats): EcosystemAdvice => {
  if (stats.ecosystemHealth < 35) {
    return { id: 'recover', tone: 'danger' };
  }
  if (env.temperature < 5 || env.temperature > 38) {
    return { id: 'temperature', tone: 'danger' };
  }
  if (env.moisture < 30) {
    return { id: 'moisture.low', tone: 'danger' };
  }
  if (env.moisture > 90) {
    return { id: 'moisture.high', tone: 'watch' };
  }
  if (env.sunlight < 30) {
    return { id: 'sunlight.low', tone: 'watch' };
  }
  if (env.sunlight > 88) {
    return { id: 'sunlight.high', tone: 'watch' };
  }
  if (stats.ecosystemHealth < 70 || stats.biodiversityIndex < 0.8) {
    return { id: 'diversity', tone: 'watch' };
  }
  return { id: 'observe', tone: 'balanced' };
};
