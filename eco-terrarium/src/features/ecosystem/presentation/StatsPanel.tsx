import React from 'react';
import { Activity, ShieldCheck, Dna, Music, Clock, Skull, BarChart2, Leaf, Bug, Crosshair, Network } from 'lucide-react';
import { EcosystemStats, SimHistoryPoint } from '../../../shared/kernel/types';
import { EnvironmentState } from '../../../shared/kernel/types';
import { useI18n } from '../../i18n';
import { EcologyAdvisor } from './EcologyAdvisor';

interface Props {
  stats: EcosystemStats;
  history: SimHistoryPoint[];
  env: EnvironmentState;
}

export const StatsPanel: React.FC<Props> = ({ stats, history, env }) => {
  const { t } = useI18n();
  const formatTime = (seconds: number) => t.units.duration(Math.floor(seconds / 60), seconds % 60);

  // Sparkline calculation for mini graph
  const maxVal = Math.max(
    1,
    ...history.map((h) => Math.max(h.producers, h.herbivores, h.predators, h.decomposers))
  );

  const getPoints = (accessor: (h: SimHistoryPoint) => number) => {
    if (history.length < 2) return '';
    const width = 160;
    const height = 36;
    return history
      .map((h, idx) => {
        const x = (idx / (history.length - 1)) * width;
        const y = height - (accessor(h) / maxVal) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="flex flex-col gap-3">
      <EcologyAdvisor env={env} stats={stats} />
      <section aria-label={t.stats.sectionLabel} className="glass-panel rounded-2xl p-4 flex flex-col gap-4 text-xs">
      {/* Header with Health & Bio Harmony Score */}
      <div className="flex items-center justify-between section-divider pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-eco-glow/20 text-eco-glow">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">{t.stats.health}</div>
            <div className="text-base font-bold font-mono text-eco-glow">
              {stats.ecosystemHealth}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-200">
            <Music className="w-4 h-4" />
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">{t.stats.harmony}</div>
            <div className="text-base font-bold font-mono text-emerald-200">
              {stats.bioHarmonyScore} <span className="text-xs text-slate-400 font-normal">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trophic Food Web Breakdown */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-slate-300 font-semibold">
          <span>{t.stats.foodWeb}</span>
          <span className="font-mono text-slate-400">{t.units.totalOrganisms(stats.totalOrganisms)}</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {/* Producers */}
          <div className="trophic-cell trophic-cell-producer">
            <Leaf className="w-4 h-4" />
            <span className="text-xs text-emerald-100 font-medium">{t.stats.trophic.producer}</span>
            <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{stats.producerCount}</span>
          </div>

          {/* Herbivores */}
          <div className="trophic-cell trophic-cell-herbivore">
            <Bug className="w-4 h-4" />
            <span className="text-xs text-emerald-100 font-medium">{t.stats.trophic.herbivore}</span>
            <span className="font-mono font-bold text-emerald-200 text-sm mt-0.5">{stats.herbivoreCount}</span>
          </div>

          {/* Predators */}
          <div className="trophic-cell trophic-cell-predator">
            <Crosshair className="w-4 h-4" />
            <span className="text-xs text-emerald-100 font-medium">{t.stats.trophic.predator}</span>
            <span className="font-mono font-bold text-emerald-200 text-sm mt-0.5">{stats.predatorCount}</span>
          </div>

          {/* Decomposers */}
          <div className="trophic-cell trophic-cell-decomposer">
            <Network className="w-4 h-4" />
            <span className="text-xs text-emerald-100 font-medium">{t.stats.trophic.decomposer}</span>
            <span className="font-mono font-bold text-emerald-200 text-sm mt-0.5">{stats.decomposerCount}</span>
          </div>
        </div>
      </div>

      {/* Lotka-Volterra Mini Oscillation Graph */}
      <div className="observation-chart p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <BarChart2 className="w-3 h-3 text-emerald-300" />
            <span>{t.stats.chartTitle}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px]">
            <span className="text-emerald-200">{t.stats.chartLegend.producers}</span>
            <span className="text-emerald-100">{t.stats.chartLegend.herbivores}</span>
            <span className="text-emerald-50">{t.stats.chartLegend.predators}</span>
          </div>
        </div>

        <div className="w-full h-9 flex items-center justify-center">
          {history.length > 2 ? (
            <svg className="w-full h-9 overflow-visible" viewBox="0 0 160 36">
              <polyline
                fill="none"
                stroke="#34d399"
                strokeWidth="1.5"
                points={getPoints((h) => h.producers)}
              />
              <polyline
                fill="none"
                stroke="#f472b6"
                strokeWidth="1.5"
                points={getPoints((h) => h.herbivores)}
              />
              <polyline
                fill="none"
                stroke="#a78bfa"
                strokeWidth="1.5"
                points={getPoints((h) => h.predators)}
              />
            </svg>
          ) : (
            <span className="text-xs text-slate-500 font-mono">{t.stats.chartEmpty}</span>
          )}
        </div>
      </div>

      {/* Detailed Meta Statistics Footer */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Dna className="w-3.5 h-3.5 text-emerald-300" />
          <span>{t.stats.biodiversity}</span>
          <span className="font-mono font-bold text-emerald-200">{stats.biodiversityIndex}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.stats.unlocked}</span>
          <span className="font-mono font-bold text-emerald-300">{stats.unlockedSpeciesCount} / 16</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-emerald-300" />
          <span>{t.stats.survival}</span>
          <span className="font-mono text-emerald-200">{formatTime(stats.simulationAgeSeconds)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Skull className="w-3.5 h-3.5 text-emerald-300" />
          <span>{t.stats.extinction}</span>
          <span className="font-mono text-emerald-200">{t.units.organisms(stats.extinctionCount)}</span>
        </div>
      </div>
      </section>
    </div>
  );
};
