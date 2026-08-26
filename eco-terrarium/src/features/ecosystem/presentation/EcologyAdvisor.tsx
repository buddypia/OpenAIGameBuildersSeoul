import React from 'react';
import { AlertTriangle, Compass, HeartPulse, Sparkles } from 'lucide-react';
import { EcosystemStats, EnvironmentState } from '../../../shared/kernel/types';
import { useI18n } from '../../i18n';
import { getEcosystemAdvice, getEnvironmentReading } from '../domain/ecosystemGuidance';

interface Props {
  env: EnvironmentState;
  stats: EcosystemStats;
}

const toneClass = {
  balanced: 'advisor-tone-balanced',
  watch: 'advisor-tone-watch',
  danger: 'advisor-tone-danger',
};

export const EcologyAdvisor: React.FC<Props> = ({ env, stats }) => {
  const { t } = useI18n();
  const advice = getEcosystemAdvice(env, stats);
  const adviceText = t.advisor.advice[advice.id];
  const readings = (['sunlight', 'moisture', 'temperature'] as const).map((kind) => ({
    kind,
    name: t.advisor.readingNames[kind],
    ...getEnvironmentReading(kind, env),
  }));

  return (
    <section aria-label={t.advisor.sectionLabel} className="glass-panel rounded-2xl p-4 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`advisor-icon ${toneClass[advice.tone]}`} aria-hidden="true">
            {advice.tone === 'danger' ? <AlertTriangle className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="font-semibold text-emerald-50">{t.advisor.title}</h2>
            <p className="mt-0.5 text-slate-400">{t.advisor.subtitle}</p>
          </div>
        </div>
        <div className="health-chip" aria-label={t.advisor.healthAria(stats.ecosystemHealth)}>
          <HeartPulse className="h-3.5 w-3.5" />
          <span>{stats.ecosystemHealth}%</span>
        </div>
      </div>

      <div className={`advisor-callout mt-3 ${toneClass[advice.tone]}`} role="status" aria-live="polite">
        <div className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{adviceText.title}</span>
        </div>
        <p className="mt-1.5 leading-relaxed text-slate-200">{adviceText.detail}</p>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-1.5" aria-label={t.advisor.readingsLabel}>
        {readings.map((reading) => (
          <li key={reading.kind} className={`environment-reading ${toneClass[reading.tone]}`}>
            <span className="block text-[10px] text-slate-400">{reading.name}</span>
            <strong className="mt-0.5 block text-[11px]">{t.advisor.readings[reading.id].label}</strong>
            <span className="mt-1 hidden leading-snug text-slate-400 xl:block">
              {t.advisor.readings[reading.id].detail}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
