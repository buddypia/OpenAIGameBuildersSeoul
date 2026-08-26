import React from 'react';
import { LOCALES, LOCALE_NAMES, LOCALE_SHORT_NAMES } from '../domain/locale';
import { useI18n } from './I18nProvider';

interface Props {
  /** `compact` fits the top bar; `full` spells the language out on the start screen. */
  variant?: 'compact' | 'full';
  className?: string;
}

export const LanguageToggle: React.FC<Props> = ({ variant = 'compact', className }) => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.language.groupLabel}
      className={`language-toggle ${className ?? ''}`}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          aria-label={t.language.optionLabel(LOCALE_NAMES[option])}
          className={`language-toggle-option ${locale === option ? 'language-toggle-option-active' : ''}`}
        >
          {variant === 'compact' ? LOCALE_SHORT_NAMES[option] : LOCALE_NAMES[option]}
        </button>
      ))}
    </div>
  );
};
