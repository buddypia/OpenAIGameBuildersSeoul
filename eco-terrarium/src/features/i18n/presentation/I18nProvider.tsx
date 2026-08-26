import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Quest, SpeciesInfo } from '../../../shared/kernel/types';
import { DEFAULT_LOCALE, LOCALE_HTML_LANG, type Locale } from '../domain/locale';
import { MESSAGES, type Messages } from '../domain/messages';
import { getQuestText, type QuestText } from '../domain/questText';
import { getSpeciesText, type SpeciesText } from '../domain/speciesText';
import { resolveInitialLocale, writeStoredLocale } from '../infrastructure/localePreference';

export interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** The whole message tree for the active locale. */
  t: Messages;
  /** Localized copy for a species, without cloning the live simulation object. */
  speciesText: (species: SpeciesInfo) => SpeciesText;
  questText: (quest: Quest) => QuestText;
}

const I18nContext = createContext<I18nValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Resolved lazily so the link/browser/storage lookup runs once, before paint.
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale());

  // Keeps assistive technology and CJK font selection in sync with the UI.
  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML_LANG[locale];
    document.title = MESSAGES[locale].meta.documentTitle;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStoredLocale(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE],
      speciesText: (species: SpeciesInfo) => getSpeciesText(species, locale),
      questText: (quest: Quest) => getQuestText(quest, locale),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used inside <I18nProvider>.');
  }
  return value;
}
