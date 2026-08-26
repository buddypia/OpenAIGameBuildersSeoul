/** Public API for the Ecosystem bounded context. */
export { EcosystemEngine, occursDuringInterval, type ConsumptionEffect } from './domain/ecosystemEngine';
export type { Shockwave, SimulationCallbacks } from './domain/ecosystemEngine';
export {
  calculateEcosystemScores,
  calculateLVDerivatives,
  calculateShannonIndex,
  DEFAULT_LV_PARAMS,
  getEnvironmentalGrowthMultiplier,
  getTemperatureMortalityStress,
  rk4Step,
} from './domain/lotkaVolterra';
export type { LotkaVolterraState, LVParameters } from './domain/lotkaVolterra';
export { getEcosystemAdvice, getEnvironmentReading } from './domain/ecosystemGuidance';
export type {
  EcosystemAdvice,
  EcosystemAdviceId,
  EnvironmentReading,
  EnvironmentReadingId,
  EnvironmentTone,
} from './domain/ecosystemGuidance';
export { checkSpeciation, crossoverGenomes, mutateGenome } from './domain/genetics';
export {
  breathingScalar,
  clamp,
  radialPulseWave,
  travelingSpineWave,
} from './domain/harmonicMotion';
export type {
  RadialPulseParams,
  SpineWaveSample,
} from './domain/harmonicMotion';
export { INITIAL_SPECIES_DATABASE } from './domain/speciesData';
export { EnvironmentHUD } from './presentation/EnvironmentHUD';
export type { ActiveTool } from './presentation/EnvironmentHUD';
export { CreaturePortrait } from './presentation/CreaturePortrait';
export { StatsPanel } from './presentation/StatsPanel';
export { TerrariumCanvas } from './presentation/TerrariumCanvas';
export { TerrariumRenderer } from './presentation/terrariumRenderer';
export type { RenderContext } from './presentation/terrariumRenderer';
