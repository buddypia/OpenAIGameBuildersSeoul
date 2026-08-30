import { Genome, EnvironmentState, SpeciesInfo } from '../../../shared/kernel/types';

/**
 * Standard Normal Random Generator (Box-Muller Transform)
 */
function randomGaussian(mean = 0, stdev = 1): number {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdev * randStdNormal;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Mutates a genome based on parent traits, environmental pressures, and mutagen factors
 */
export function mutateGenome(
  parentGenome: Genome,
  env: EnvironmentState,
  hasMutagen: boolean = false
): Genome {
  const mutationFactor = (parentGenome.mutationRate || 0.15) * (hasMutagen ? 3.0 : 1.0);

  // Environmental directional drift
  let tempDrift = 0;
  if (env.temperature > parentGenome.tempOpt + 5) {
    tempDrift = 0.5 * mutationFactor; // Pushing towards heat adaptation
  } else if (env.temperature < parentGenome.tempOpt - 5) {
    tempDrift = -0.5 * mutationFactor; // Pushing towards cold adaptation
  }

  let moistDrift = 0;
  if (env.moisture > parentGenome.moistOpt + 10) {
    moistDrift = 0.8 * mutationFactor;
  } else if (env.moisture < parentGenome.moistOpt - 10) {
    moistDrift = -0.8 * mutationFactor;
  }

  const newSize = clamp(parentGenome.size + randomGaussian(0, 0.1 * mutationFactor), 0.5, 2.5);
  const newSpeed = clamp(parentGenome.speed + randomGaussian(0, 0.15 * mutationFactor), 0.4, 3.0);
  const newMetabolism = clamp(parentGenome.metabolism + randomGaussian(0, 0.1 * mutationFactor), 0.3, 2.0);
  const newTempOpt = clamp(parentGenome.tempOpt + randomGaussian(tempDrift, 1.5 * mutationFactor), -10, 45);
  const newTempTol = clamp(parentGenome.tempTol + randomGaussian(0, 0.8 * mutationFactor), 3, 20);
  const newMoistOpt = clamp(parentGenome.moistOpt + randomGaussian(moistDrift, 2.5 * mutationFactor), 10, 95);
  const newHue = (parentGenome.hue + randomGaussian(0, 15 * mutationFactor) + 360) % 360;
  const newMutationRate = clamp(parentGenome.mutationRate + randomGaussian(0, 0.02 * mutationFactor), 0.05, 0.5);
  const newDefense = clamp(parentGenome.defense + randomGaussian(0, 0.08 * mutationFactor), 0.0, 1.0);
  const newBioluminescence = clamp(parentGenome.bioluminescence + randomGaussian(0, 0.1 * mutationFactor), 0.0, 1.0);

  return {
    size: Number(newSize.toFixed(2)),
    speed: Number(newSpeed.toFixed(2)),
    metabolism: Number(newMetabolism.toFixed(2)),
    tempOpt: Number(newTempOpt.toFixed(1)),
    tempTol: Number(newTempTol.toFixed(1)),
    moistOpt: Number(newMoistOpt.toFixed(1)),
    hue: Math.round(newHue),
    mutationRate: Number(newMutationRate.toFixed(3)),
    defense: Number(newDefense.toFixed(2)),
    bioluminescence: Number(newBioluminescence.toFixed(2)),
  };
}

/**
 * Crossover two genomes (Sexual reproduction or spore hybridization)
 */
export function crossoverGenomes(g1: Genome, g2: Genome, env: EnvironmentState, hasMutagen: boolean = false): Genome {
  const blended: Genome = {
    size: Math.random() > 0.5 ? g1.size : g2.size,
    speed: Math.random() > 0.5 ? g1.speed : g2.speed,
    metabolism: (g1.metabolism + g2.metabolism) / 2,
    tempOpt: (g1.tempOpt + g2.tempOpt) / 2,
    tempTol: Math.max(g1.tempTol, g2.tempTol),
    moistOpt: (g1.moistOpt + g2.moistOpt) / 2,
    hue: Math.random() > 0.5 ? g1.hue : g2.hue,
    mutationRate: (g1.mutationRate + g2.mutationRate) / 2,
    defense: (g1.defense + g2.defense) / 2,
    bioluminescence: Math.max(g1.bioluminescence, g2.bioluminescence),
  };
  return mutateGenome(blended, env, hasMutagen);
}

/**
 * Checks if an organism qualifies for Speciation (New Species Discovery)
 */
export function checkSpeciation(
  currentSpeciesId: string,
  genome: Genome,
  env: EnvironmentState,
  speciesList: SpeciesInfo[],
  extraContext?: { totalDeadCount?: number; harmonyHigh?: boolean; isNight?: boolean; tempShock?: boolean }
): SpeciesInfo | null {
  for (const sp of speciesList) {
    if (sp.id === currentSpeciesId) continue;
    // 이미 해금된 종은 '새로운 발견'이 아니다. 이걸 건너뛰지 않으면
    // 조건이 비어 있는 기본 4종(루미 플로라·젤리 위글·팬텀 립·마이셀 링커)이
    // 목록 앞자리에서 먼저 걸려, 정작 새로 태어날 종까지 판정이 도달하지 못한다.
    if (sp.unlocked) continue;
    const cond = sp.spawnConditions;
    if (!cond) continue;

    // Check parent species requirement
    if (cond.parentSpeciesId && cond.parentSpeciesId !== currentSpeciesId) {
      continue;
    }

    // Check environmental bounds
    if (cond.minSun !== undefined && env.sunlight < cond.minSun) continue;
    if (cond.maxSun !== undefined && env.sunlight > cond.maxSun) continue;
    if (cond.minMoist !== undefined && env.moisture < cond.minMoist) continue;
    if (cond.maxMoist !== undefined && env.moisture > cond.maxMoist) continue;
    if (cond.minTemp !== undefined && env.temperature < cond.minTemp) continue;
    if (cond.maxTemp !== undefined && env.temperature > cond.maxTemp) continue;
    if (cond.minNutrients !== undefined && env.nutrients < cond.minNutrients) continue;

    // Check special conditions
    if (cond.specialCondition === 'harmony_high' && !extraContext?.harmonyHigh) continue;
    if (cond.specialCondition === 'night_cosmic' && !extraContext?.isNight) continue;
    if (cond.specialCondition === 'thermal_shock' && !extraContext?.tempShock) continue;

    // Genetic similarity / distance threshold
    const bg = sp.baseGenome;
    const traitDistance =
      Math.abs(genome.size - bg.size) * 0.5 +
      Math.abs(genome.speed - bg.speed) * 0.6 +
      Math.abs(genome.tempOpt - bg.tempOpt) * 0.05 +
      Math.abs(genome.defense - bg.defense) * 0.8;

    // If trait distance is close or environmental pressure triggers a breakthrough
    if (traitDistance < 2.2 || Math.random() < genome.mutationRate * 0.3) {
      return sp;
    }
  }

  return null;
}
