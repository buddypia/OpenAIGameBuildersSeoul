/**
 * The set of languages the terrarium can be played in.
 *
 * Korean is the authoring language: `speciesData.ts` and `questData.ts` carry
 * their Korean copy inline, and every other locale is expressed as an overlay
 * on top of it (see `speciesText.ts` / `questText.ts`). Adding a language
 * therefore never requires touching simulation data.
 */
export const LOCALES = ['ko', 'en', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

/** Korean is both the authoring language and what a first-time visitor sees. */
export const DEFAULT_LOCALE: Locale = 'ko';

/** Name of each language, written in that language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

/** Two-letter chip used by the compact in-game switcher. */
export const LOCALE_SHORT_NAMES: Record<Locale, string> = {
  ko: 'KO',
  en: 'EN',
  ja: 'JA',
};

/** Value written to `<html lang>` so screen readers pick the right voice. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Maps a BCP 47 tag (`ja`, `ja-JP`, `ko-KR`, …) onto a supported locale.
 * Returns null for anything unsupported so the caller decides the fallback.
 */
export function matchLocale(languageTag: string | undefined | null): Locale | null {
  if (!languageTag) return null;
  const primary = languageTag.toLowerCase().split('-')[0];
  return isLocale(primary) ? primary : null;
}
