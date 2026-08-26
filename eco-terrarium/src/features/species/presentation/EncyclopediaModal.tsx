import React, { useState } from 'react';
import { X, BookOpen, Lock, Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { SpeciesInfo, TrophicLevel } from '../../../shared/kernel/types';
import { CreaturePortrait } from '../../ecosystem';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  speciesList: SpeciesInfo[];
  onClose: () => void;
}

export const EncyclopediaModal: React.FC<Props> = ({ speciesList, onClose }) => {
  const { t, speciesText } = useI18n();
  const dialogRef = useDialog(onClose);
  const [selectedTrophic, setSelectedTrophic] = useState<TrophicLevel | 'all'>('all');
  const [activeSpeciesId, setActiveSpeciesId] = useState<string>(speciesList[0]?.id || '');

  const unlockedCount = speciesList.filter((s) => s.unlocked).length;
  const filteredSpecies = speciesList.filter(
    (s) => selectedTrophic === 'all' || s.trophicLevel === selectedTrophic
  );

  const activeSpecies = speciesList.find((s) => s.id === activeSpeciesId) || speciesList[0];
  const activeSpeciesText = activeSpecies ? speciesText(activeSpecies) : null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.encyclopedia.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col gap-4 border text-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-eco-glow/20 text-eco-glow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.encyclopedia.title}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t.encyclopedia.progress(
                    unlockedCount,
                    speciesList.length,
                    Math.round((unlockedCount / speciesList.length) * 100)
                  )}
                </span>
              </h2>
              <div className="text-xs text-slate-400">{t.encyclopedia.subtitle}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trophic Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['all', 'producer', 'herbivore', 'predator', 'decomposer'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTrophic(tab)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedTrophic === tab
                  ? 'bg-eco-glow/20 text-eco-glow border border-eco-glow/40 shadow-sm'
                  : 'bg-black/30 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {t.encyclopedia.filters[tab]}
            </button>
          ))}
        </div>

        {/* Main Content Split: List on Left, Details on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden min-h-[360px]">
          {/* Left Species Grid */}
          <div className="md:col-span-5 flex flex-col gap-2 overflow-y-auto pr-1">
            {filteredSpecies.map((sp) => {
              const isSelected = sp.id === activeSpeciesId;
              return (
                <button
                  key={sp.id}
                  onClick={() => setActiveSpeciesId(sp.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400/50 shadow-md'
                      : 'bg-black/30 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border overflow-hidden ${
                      sp.unlocked
                        ? 'bg-black/50 border-white/10'
                        : 'bg-slate-900/80 border-white/5 text-slate-600'
                    }`}
                  >
                    {sp.unlocked ? (
                      <CreaturePortrait species={sp} size={44} />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold truncate ${
                          sp.unlocked ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {sp.unlocked ? speciesText(sp).name : t.encyclopedia.lockedName}
                      </span>
                      {sp.unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {sp.unlocked ? sp.scientificName : t.encyclopedia.lockedScientific}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Species Detail Panel */}
          <div className="md:col-span-7 bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-3.5 overflow-y-auto">
            {activeSpecies && activeSpeciesText ? (
              activeSpecies.unlocked ? (
                <>
                  {/* Unlocked Detail */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-black/60 border border-white/10 shadow-inner relative overflow-hidden shrink-0">
                      <CreaturePortrait species={activeSpecies} size={80} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{activeSpeciesText.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                          Tier {activeSpecies.tier} · {activeSpecies.trophicLevel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 italic font-mono mt-0.5">
                        {activeSpecies.scientificName}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                    {activeSpeciesText.description}
                  </div>

                  {/* Lore */}
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.encyclopedia.loreTitle}</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed italic text-[11px]">
                      "{activeSpeciesText.lore}"
                    </p>
                  </div>

                  {/* Base Genome Characteristics */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>{t.encyclopedia.traitsTitle}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        {t.encyclopedia.traits.tempOpt}: {activeSpecies.baseGenome.tempOpt}°C
                      </div>
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        {t.encyclopedia.traits.moistOpt}: {activeSpecies.baseGenome.moistOpt}%
                      </div>
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        {t.encyclopedia.traits.speed}: {activeSpecies.baseGenome.speed} m/s
                      </div>
                      <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                        {t.encyclopedia.traits.bioluminescence}: {Math.round(activeSpecies.baseGenome.bioluminescence * 100)}%
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Locked Detail / Hint */
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-500 text-2xl shadow-inner">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">{t.encyclopedia.lockedTitle}</h4>
                    <div className="text-xs text-slate-500 mt-1">{t.encyclopedia.lockedBody}</div>
                  </div>

                  <div className="w-full bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 text-left flex flex-col gap-1.5 mt-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.encyclopedia.hintTitle}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      {activeSpeciesText.evolutionHint}
                    </p>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
