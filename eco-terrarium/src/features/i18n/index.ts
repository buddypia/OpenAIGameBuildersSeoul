/** Public API for the Localization bounded context. */
export {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  LOCALE_HTML_LANG,
  LOCALE_NAMES,
  LOCALE_SHORT_NAMES,
  matchLocale,
} from './domain/locale';
export type { Locale } from './domain/locale';
export { MESSAGES } from './domain/messages';
export type { Messages } from './domain/messages';
export { getSpeciesText } from './domain/speciesText';
export type { SpeciesText } from './domain/speciesText';
export { getQuestText } from './domain/questText';
export type { QuestText } from './domain/questText';
export {
  getDefaultLocaleStorage,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  resolveInitialLocale,
  writeStoredLocale,
} from './infrastructure/localePreference';
export type { LocaleStorage } from './infrastructure/localePreference';
export { I18nProvider, useI18n } from './presentation/I18nProvider';
export type { I18nValue } from './presentation/I18nProvider';
export { LanguageToggle } from './presentation/LanguageToggle';
