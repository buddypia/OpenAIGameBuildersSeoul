import { HiveEcosystemDNA } from '../../../shared/kernel/types';
import { decodeEcosystemDNA, encodeEcosystemDNA } from './dnaCodec';

/**
 * Local persistence for a single in-progress terrarium.
 *
 * The shareable DNA payload is reused verbatim as the ecosystem body so the
 * save format and the Hive share format can never drift apart. Quest progress
 * is stored alongside it because it is player progression rather than
 * ecosystem state, and must not leak into codes shared with other players.
 */

export const LOCAL_SAVE_KEY = 'eco-terrarium:save:v1';

export interface LocalSaveSnapshot {
  dna: HiveEcosystemDNA;
  completedQuestIds: string[];
  savedAt: number;
}

/** The subset of the Storage API this module needs, so tests can inject a fake. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface StoredEnvelope {
  v: 1;
  dna: string;
  quests: string[];
  savedAt: number;
}

/**
 * Resolves the browser storage. Access itself can throw in Safari private mode,
 * so even reading the property is guarded.
 */
export function getDefaultSaveStorage(): SaveStorage | null {
  try {
    const candidate = (globalThis as { localStorage?: SaveStorage }).localStorage;
    if (!candidate || typeof candidate.getItem !== 'function') return null;
    return candidate;
  } catch {
    return null;
  }
}

function isStoredEnvelope(value: unknown): value is StoredEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const envelope = value as Partial<StoredEnvelope>;
  return (
    envelope.v === 1 &&
    typeof envelope.dna === 'string' &&
    Array.isArray(envelope.quests) &&
    envelope.quests.every((id) => typeof id === 'string') &&
    typeof envelope.savedAt === 'number' &&
    Number.isFinite(envelope.savedAt)
  );
}

/**
 * Persists the terrarium. Returns false instead of throwing when storage is
 * unavailable or full, so a failed autosave can never interrupt the game loop.
 */
export function saveEcosystemLocally(
  snapshot: LocalSaveSnapshot,
  storage: SaveStorage | null = getDefaultSaveStorage()
): boolean {
  if (!storage) return false;
  try {
    const envelope: StoredEnvelope = {
      v: 1,
      dna: encodeEcosystemDNA(snapshot.dna),
      quests: snapshot.completedQuestIds,
      savedAt: snapshot.savedAt,
    };
    storage.setItem(LOCAL_SAVE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * Restores the terrarium. Any unreadable, corrupted or foreign-version payload
 * is discarded rather than surfaced, so a bad save can never wedge the game on
 * a permanently failing load.
 */
export function loadEcosystemLocally(
  storage: SaveStorage | null = getDefaultSaveStorage()
): LocalSaveSnapshot | null {
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(LOCAL_SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredEnvelope(parsed)) {
      clearEcosystemLocally(storage);
      return null;
    }

    const dna = decodeEcosystemDNA(parsed.dna);
    if (!dna) {
      clearEcosystemLocally(storage);
      return null;
    }

    return { dna, completedQuestIds: parsed.quests, savedAt: parsed.savedAt };
  } catch {
    clearEcosystemLocally(storage);
    return null;
  }
}

/** Removes the save. Used on corruption and by an explicit player reset. */
export function clearEcosystemLocally(
  storage: SaveStorage | null = getDefaultSaveStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(LOCAL_SAVE_KEY);
  } catch {
    // A storage that refuses removal is already unusable; nothing to recover.
  }
}
