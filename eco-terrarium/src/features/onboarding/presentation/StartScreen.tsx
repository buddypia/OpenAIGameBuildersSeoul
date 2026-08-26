import React from 'react';
import { Droplets, FlaskConical, Leaf, Play, Sun, Thermometer } from 'lucide-react';
import { LanguageToggle, useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  onStart: () => void;
}

/** Icons pair positionally with `startScreen.steps` in the locale catalogue. */
const PLAY_STEP_ICONS = [Sun, FlaskConical, Thermometer];

export const StartScreen: React.FC<Props> = ({ onStart }) => {
  const { t } = useI18n();
  const dialogRef = useDialog(onStart);

  return (
    <div className="start-screen-backdrop fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-screen-title"
        aria-describedby="start-screen-description"
        tabIndex={-1}
        className="start-screen w-full max-w-4xl overflow-hidden"
      >
        <div className="start-screen-hero relative px-5 py-7 sm:px-10 sm:py-10">
          <div className="start-screen-orb start-screen-orb-left" aria-hidden="true" />
          <div className="start-screen-orb start-screen-orb-right" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="start-screen-kicker">
              <Leaf className="h-4 w-4" aria-hidden="true" />
              <span>{t.startScreen.kicker}</span>
            </div>
            <h1 id="start-screen-title" className="mt-4 text-3xl font-bold tracking-[-0.05em] text-white sm:text-5xl">
              {t.startScreen.title}
            </h1>
            <p className="mt-3 text-sm font-medium text-emerald-100/75 sm:text-base">
              {t.startScreen.tagline}
            </p>
            <p id="start-screen-description" className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {t.startScreen.description}
            </p>
          </div>
          <LanguageToggle variant="full" className="absolute right-5 top-5 sm:right-10 sm:top-10" />
        </div>

        <div className="start-screen-content px-5 py-5 sm:px-10 sm:py-7">
          <section aria-labelledby="start-objective-title">
            <div className="flex items-center gap-2">
              <span className="start-screen-index">01</span>
              <h2 id="start-objective-title" className="text-xs font-bold tracking-[0.12em] text-emerald-200">
                {t.startScreen.objectiveTitle}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t.startScreen.objectiveBody}
            </p>
          </section>

          <section className="mt-6" aria-labelledby="start-play-title">
            <div className="flex items-center gap-2">
              <span className="start-screen-index">02</span>
              <h2 id="start-play-title" className="text-xs font-bold tracking-[0.12em] text-emerald-200">
                {t.startScreen.playTitle}
              </h2>
            </div>
            <ol className="mt-3 grid gap-2 sm:grid-cols-3">
              {t.startScreen.steps.map((step, index) => {
                const Icon = PLAY_STEP_ICONS[index];
                return (
                  <li key={step.label} className="start-step">
                    <Icon className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{step.label}</div>
                      <div className="mt-0.5 text-xs leading-5 text-slate-400">{step.description}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="start-screen-footer mt-7 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs leading-5 text-slate-400">
              <Droplets className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
              <span>{t.startScreen.footnote}</span>
            </div>
            <button type="button" onClick={onStart} className="start-screen-action shrink-0">
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              {t.startScreen.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
