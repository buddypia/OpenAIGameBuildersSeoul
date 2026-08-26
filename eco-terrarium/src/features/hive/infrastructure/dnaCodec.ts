import LZString from 'lz-string';
import { EnvironmentState, Genome, HiveEcosystemDNA, PersistedOrganism, TerrariumCustomization } from '../../../shared/kernel/types';

const VALID_BOTTLES = new Set(['classic-jar', 'geometric-dome', 'antique-flask', 'crystal-sphere']);
const VALID_SUBSTRATES = new Set(['moss-forest', 'deep-sea-sand', 'volcanic-obsidian', 'crystal-cave']);
const VALID_BACKGROUNDS = new Set(['cozy-lab', 'dawn-mist', 'sunset-window', 'cosmic-aurora']);
const MAX_SHARED_ORGANISMS = 100;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const inRange = (value: unknown, min: number, max: number): value is number =>
  isFiniteNumber(value) && value >= min && value <= max;

function isEnvironmentState(value: unknown): value is EnvironmentState {
  if (!value || typeof value !== 'object') return false;
  const env = value as Record<string, unknown>;
  return (
    inRange(env.sunlight, 0, 100) &&
    inRange(env.moisture, 0, 100) &&
    inRange(env.temperature, -10, 45) &&
    inRange(env.nutrients, 0, 100) &&
    inRange(env.dayNightCycle, 0, 1) &&
    typeof env.autoDayNight === 'boolean' &&
    [0, 0.5, 1, 2, 5].includes(env.timeSpeed as number)
  );
}

function isCustomization(value: unknown): value is TerrariumCustomization {
  if (!value || typeof value !== 'object') return false;
  const customization = value as Record<string, unknown>;
  return (
    VALID_BOTTLES.has(customization.bottleShape as string) &&
    VALID_SUBSTRATES.has(customization.substrate as string) &&
    VALID_BACKGROUNDS.has(customization.background as string)
  );
}

function isGenome(value: unknown): value is Genome {
  if (!value || typeof value !== 'object') return false;
  const genome = value as Record<string, unknown>;
  return (
    inRange(genome.size, 0.5, 2.5) &&
    inRange(genome.speed, 0.4, 3) &&
    inRange(genome.metabolism, 0.3, 2) &&
    inRange(genome.tempOpt, -10, 45) &&
    inRange(genome.tempTol, 3, 20) &&
    inRange(genome.moistOpt, 10, 95) &&
    inRange(genome.hue, 0, 360) &&
    inRange(genome.mutationRate, 0.05, 0.5) &&
    inRange(genome.defense, 0, 1) &&
    inRange(genome.bioluminescence, 0, 1)
  );
}

function isPersistedOrganism(value: unknown, allowMissingGeneration = false): value is PersistedOrganism {
  if (!value || typeof value !== 'object') return false;
  const organism = value as Record<string, unknown>;
  return (
    typeof organism.speciesId === 'string' &&
    organism.speciesId.length > 0 &&
    isGenome(organism.genome) &&
    (allowMissingGeneration || (isFiniteNumber(organism.generation) && Number.isInteger(organism.generation) && organism.generation >= 1)) &&
    (organism.customName === undefined || typeof organism.customName === 'string')
  );
}

/** Validates untrusted URL/import data before it can reach the simulation. */
export function isValidEcosystemDNA(value: unknown): value is HiveEcosystemDNA {
  if (!value || typeof value !== 'object') return false;
  const dna = value as Record<string, unknown>;
  const isLegacyPayload = !Array.isArray(dna.organisms) && Array.isArray(dna.sampleOrganisms);
  const organisms = dna.organisms ?? dna.sampleOrganisms;
  const stats = dna.stats as Record<string, unknown> | undefined;
  return (
    typeof dna.version === 'string' &&
    typeof dna.creatorName === 'string' &&
    typeof dna.terrariumName === 'string' &&
    isFiniteNumber(dna.timestamp) &&
    isEnvironmentState(dna.env) &&
    isCustomization(dna.customization) &&
    Array.isArray(dna.speciesUnlocked) && dna.speciesUnlocked.every((id) => typeof id === 'string') &&
    Array.isArray(organisms) && organisms.length <= MAX_SHARED_ORGANISMS && organisms.every((organism) => isPersistedOrganism(organism, isLegacyPayload)) &&
    !!stats &&
    isFiniteNumber(stats.totalAge) && stats.totalAge >= 0 &&
    isFiniteNumber(stats.highestScore) && stats.highestScore >= 0 &&
    isFiniteNumber(stats.discoveredCount) && stats.discoveredCount >= 0
  );
}

/**
 * Serializes Ecosystem State into an lz-string compressed, URI-safe DNA string
 */
export function encodeEcosystemDNA(payload: HiveEcosystemDNA): string {
  try {
    const jsonStr = JSON.stringify(payload);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (e) {
    console.error('Failed to encode ecosystem DNA:', e);
    return '';
  }
}

/**
 * Decodes compressed DNA string back to Ecosystem payload
 */
export function decodeEcosystemDNA(compressedStr: string): HiveEcosystemDNA | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressedStr.trim());
    if (!decompressed) return null;
    const parsed: unknown = JSON.parse(decompressed);
    if (!isValidEcosystemDNA(parsed)) return null;

    // Version 1.0.0 stored a representative sample under a different key.
    // Normalize it so the rest of the app has one restoration path.
    if (!Array.isArray(parsed.organisms)) {
      return {
        ...parsed,
        organisms: (parsed.sampleOrganisms ?? []).map((organism) => ({ ...organism, generation: organism.generation ?? 1 })),
      };
    }
    return parsed;
  } catch (e) {
    console.error('Failed to decode ecosystem DNA:', e);
    return null;
  }
}

/**
 * Generates a short, non-reversible fingerprint for a shared DNA payload.
 * The full link is required to import an ecosystem because a short hash cannot
 * losslessly contain a complete population snapshot without a server lookup.
 */
export function generateShortCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
  return `ECO-${hex.slice(0, 4)}-${hex.slice(4, 8) || 'X9'}`;
}
