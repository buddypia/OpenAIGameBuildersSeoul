import { DEFAULT_LOCALE, isLocale, matchLocale, type Locale } from '../domain/locale';

/**
 * Browser-side storage of the chosen language.
 *
 * Kept separate from the terrarium save on purpose: a shared DNA link must
 * never force the visitor's UI into the author's language, and clearing the
 * terrarium must not reset the reader's language.
 */
export const LOCALE_STORAGE_KEY = 'eco-terrarium:locale:v1';

/** The subset of the Storage API this module needs, so tests can inject a fake. */
export type LocaleStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Access itself can throw in Safari private mode, so even reading is guarded. */
export function getDefaultLocaleStorage(): LocaleStorage | null {
  try {
    const candidate = (globalThis as { localStorage?: LocaleStorage }).localStorage;
    if (!candidate || typeof candidate.getItem !== 'function') return null;
    return candidate;
  } catch {
    return null;
  }
}

export function readStoredLocale(
  storage: LocaleStorage | null = getDefaultLocaleStorage()
): Locale | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Returns false instead of throwing so a full or blocked storage is harmless. */
export function writeStoredLocale(
  locale: Locale,
  storage: LocaleStorage | null = getDefaultLocaleStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolution order: an explicit `?lang=` in the link, then the player's past
 * choice, then Korean. The query parameter comes first so a terrarium can be
 * shared straight into a given language.
 *
 * The browser's `navigator.language` is deliberately *not* consulted: Korean is
 * the product default, and a judge opening the link on an English-configured
 * machine must still land on the Korean build unless they ask otherwise.
 */
export function resolveInitialLocale(): Locale {
  const search = typeof globalThis.location === 'undefined' ? '' : globalThis.location.search;
  const requested = matchLocale(new URLSearchParams(search).get('lang'));
  if (requested) return requested;

  return readStoredLocale() ?? DEFAULT_LOCALE;
}
