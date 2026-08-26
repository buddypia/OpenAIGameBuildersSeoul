import { EnvironmentState } from '../../../shared/kernel/types';

export interface LotkaVolterraState {
  producers: number;
  herbivores: number;
  predators: number;
  decomposers: number;
  nutrients: number;
}

export interface LVParameters {
  r_max: number;        // Maximum producer intrinsic growth rate
  K_base: number;       // Base carrying capacity
  alpha_herb: number;   // Herbivore grazing rate on producers
  eps_herb: number;     // Herbivore biomass conversion efficiency
  mort_herb: number;    // Herbivore natural mortality
  beta_pred: number;    // Predator predation rate on herbivores
  eps_pred: number;     // Predator conversion efficiency
  mort_pred: number;    // Predator mortality
  delta_decomp: number; // Decomposition rate of organic waste into nutrients
  mort_decomp: number;  // Decomposer decay rate
  nutrient_uptake: number; // Nutrient consumption per producer unit
}

export const DEFAULT_LV_PARAMS: LVParameters = {
  r_max: 0.8,
  K_base: 40,
  alpha_herb: 0.04,
  eps_herb: 0.7,
  mort_herb: 0.25,
  beta_pred: 0.05,
  eps_pred: 0.6,
  mort_pred: 0.3,
  delta_decomp: 0.35,
  mort_decomp: 0.2,
  nutrient_uptake: 0.15,
};

/**
 * Environmental Modulation Functions
 * Computes how Sunlight, Moisture, and Temperature alter biological growth and stress rates
 */
export function getEnvironmentalGrowthMultiplier(env: EnvironmentState): number {
  // Sunlight factor: 0~100% -> 0.1 ~ 1.5 multiplier (optimal at 60-80%)
  const sunFactor = Math.max(0.05, Math.min(1.6, (env.sunlight / 60) * Math.exp(1 - env.sunlight / 75)));

  // Moisture factor: 0~100% -> optimal around 65%
  const moistFactor = Math.max(0.05, Math.min(1.5, (env.moisture / 65) * Math.exp(1 - env.moisture / 70)));

  // Temperature Gaussian optimal curve: T_opt = 22°C, sigma = 14°C
  const tempDelta = env.temperature - 22;
  const tempFactor = Math.max(0.05, Math.exp(-(tempDelta * tempDelta) / (2 * 14 * 14)));

  return sunFactor * moistFactor * tempFactor;
}

export function getTemperatureMortalityStress(temperature: number): number {
  // Freezing (< 0°C) or Heat stress (> 35°C) increases baseline mortality
  if (temperature < 5) {
    return 1.0 + Math.pow((5 - temperature) / 10, 1.5) * 0.8;
  } else if (temperature > 32) {
    return 1.0 + Math.pow((temperature - 32) / 10, 1.5) * 0.9;
  }
  return 1.0;
}

/**
 * Computes derivatives [dP/dt, dC/dt, dH/dt, dD/dt, dN/dt]
 */
export function calculateLVDerivatives(
  state: LotkaVolterraState,
  env: EnvironmentState,
  params: LVParameters = DEFAULT_LV_PARAMS
): LotkaVolterraState {
  const envMultiplier = getEnvironmentalGrowthMultiplier(env);
  const tempStress = getTemperatureMortalityStress(env.temperature);

  const P = Math.max(0, state.producers);
  const C = Math.max(0, state.herbivores);
  const H = Math.max(0, state.predators);
  const D = Math.max(0, state.decomposers);
  const N = Math.max(0, state.nutrients);

  // Dynamic Carrying Capacity linked to soil nutrients
  const K = params.K_base * (0.4 + 0.6 * (N / 50));

  // Producer Growth
  const growthRateP = params.r_max * envMultiplier;
  const dP = growthRateP * P * (1 - P / Math.max(5, K)) - params.alpha_herb * P * C;

  // Herbivore Growth & Predation
  const dC = params.eps_herb * params.alpha_herb * P * C - params.beta_pred * C * H - params.mort_herb * tempStress * C;

  // Predator Growth & Mortality
  const dH = params.eps_pred * params.beta_pred * C * H - params.mort_pred * tempStress * H;

  // Decomposer Growth from organic waste/corpses
  const organicWaste = 0.2 * (params.mort_herb * C + params.mort_pred * H + 0.1 * P);
  const dD = params.delta_decomp * organicWaste * (env.moisture / 60) - params.mort_decomp * tempStress * D;

  // Nutrient regeneration from decomposition minus plant uptake + player input
  const dN = 0.3 * D - params.nutrient_uptake * P + (env.nutrients > 50 ? (env.nutrients - 50) * 0.05 : 0);

  return {
    producers: dP,
    herbivores: dC,
    predators: dH,
    decomposers: dD,
    nutrients: dN,
  };
}

/**
 * 4th-Order Runge-Kutta (RK4) Numerical Integration Step
 */
export function rk4Step(
  state: LotkaVolterraState,
  env: EnvironmentState,
  dt: number,
  params: LVParameters = DEFAULT_LV_PARAMS
): LotkaVolterraState {
  // k1 = f(y)
  const k1 = calculateLVDerivatives(state, env, params);

  // k2 = f(y + dt/2 * k1)
  const stateK2: LotkaVolterraState = {
    producers: state.producers + 0.5 * dt * k1.producers,
    herbivores: state.herbivores + 0.5 * dt * k1.herbivores,
    predators: state.predators + 0.5 * dt * k1.predators,
    decomposers: state.decomposers + 0.5 * dt * k1.decomposers,
    nutrients: state.nutrients + 0.5 * dt * k1.nutrients,
  };
  const k2 = calculateLVDerivatives(stateK2, env, params);

  // k3 = f(y + dt/2 * k2)
  const stateK3: LotkaVolterraState = {
    producers: state.producers + 0.5 * dt * k2.producers,
    herbivores: state.herbivores + 0.5 * dt * k2.herbivores,
    predators: state.predators + 0.5 * dt * k2.predators,
    decomposers: state.decomposers + 0.5 * dt * k2.decomposers,
    nutrients: state.nutrients + 0.5 * dt * k2.nutrients,
  };
  const k3 = calculateLVDerivatives(stateK3, env, params);

  // k4 = f(y + dt * k3)
  const stateK4: LotkaVolterraState = {
    producers: state.producers + dt * k3.producers,
    herbivores: state.herbivores + dt * k3.herbivores,
    predators: state.predators + dt * k3.predators,
    decomposers: state.decomposers + dt * k3.decomposers,
    nutrients: state.nutrients + dt * k3.nutrients,
  };
  const k4 = calculateLVDerivatives(stateK4, env, params);

  return {
    producers: Math.max(0, state.producers + (dt / 6) * (k1.producers + 2 * k2.producers + 2 * k3.producers + k4.producers)),
    herbivores: Math.max(0, state.herbivores + (dt / 6) * (k1.herbivores + 2 * k2.herbivores + 2 * k3.herbivores + k4.herbivores)),
    predators: Math.max(0, state.predators + (dt / 6) * (k1.predators + 2 * k2.predators + 2 * k3.predators + k4.predators)),
    decomposers: Math.max(0, state.decomposers + (dt / 6) * (k1.decomposers + 2 * k2.decomposers + 2 * k3.decomposers + k4.decomposers)),
    nutrients: Math.max(0, Math.min(100, state.nutrients + (dt / 6) * (k1.nutrients + 2 * k2.nutrients + 2 * k3.nutrients + k4.nutrients))),
  };
}

/**
 * Shannon-Wiener Biodiversity Index Calculation (H')
 * H' = - SUM( p_i * ln(p_i) )
 */
export function calculateShannonIndex(speciesCounts: Record<string, number>): number {
  const counts = Object.values(speciesCounts).filter((c) => c > 0);
  const total = counts.reduce((acc, v) => acc + v, 0);
  if (total <= 0 || counts.length <= 1) return 0;

  let H = 0;
  for (const c of counts) {
    const p = c / total;
    if (p > 0) {
      H -= p * Math.log(p);
    }
  }
  return Number(H.toFixed(2));
}

/**
 * Calculates overall Ecosystem Health Score (0 ~ 100%) and Bio-Harmony Score (0 ~ 1000)
 */
export function calculateEcosystemScores(
  producers: number,
  herbivores: number,
  predators: number,
  decomposers: number,
  shannonIndex: number,
  unlockedCount: number
): { health: number; harmonyScore: number } {
  const total = producers + herbivores + predators + decomposers;
  if (total === 0) return { health: 0, harmonyScore: 0 };

  // Ideal ecological pyramid ratio:
  // Producers: 40~60%, Herbivores: 25~35%, Predators: 5~15%, Decomposers: 10~20%
  const pRatio = producers / total;
  const cRatio = herbivores / total;
  const hRatio = predators / total;
  const dRatio = decomposers / total;

  let balancePenalty = 0;
  if (producers === 0) balancePenalty += 35;
  if (herbivores === 0) balancePenalty += 25;
  if (predators === 0) balancePenalty += 20;
  if (decomposers === 0) balancePenalty += 20;

  // Deviation from optimal ratios
  const ratioScore = 100 - (
    Math.abs(pRatio - 0.5) * 40 +
    Math.abs(cRatio - 0.3) * 40 +
    Math.abs(hRatio - 0.1) * 60 +
    Math.abs(dRatio - 0.1) * 50
  ) - balancePenalty;

  const health = Math.max(5, Math.min(100, Math.round(ratioScore)));

  // Bio-Harmony Score integrates health, species diversity, and unlocked achievements
  const diversityBonus = Math.min(300, shannonIndex * 120);
  const unlockBonus = unlockedCount * 25;
  const harmonyScore = Math.min(1000, Math.round(health * 5 + diversityBonus + unlockBonus));

  return { health, harmonyScore };
}
