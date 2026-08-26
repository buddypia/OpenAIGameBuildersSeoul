import React, { useState } from 'react';
import {
  X,
  Dna,
  Zap,
  Shield,
  Flame,
  Droplet,
  Sparkles,
  Heart,
  Edit2,
  Check,
  Activity,
  Palette,
  Lightbulb,
} from 'lucide-react';
import { Organism, SpeciesInfo } from '../../../shared/kernel/types';
import { CreaturePortrait } from '../../ecosystem';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  organism: Organism;
  species: SpeciesInfo | undefined;
  onClose: () => void;
  onRename: (newName: string) => void;
  onInjectMutagen: () => void;
}

export const InspectorModal: React.FC<Props> = ({
  organism,
  species,
  onClose,
  onRename,
  onInjectMutagen,
}) => {
  const { t, speciesText } = useI18n();
  const localizedSpecies = species ? speciesText(species) : null;
  const dialogRef = useDialog(onClose);
  const [isEditing, setIsEditing] = useState(false);
  // Seeded once on open: renaming mid-session must not be undone by a later
  // language switch, so this deliberately does not track `localizedSpecies`.
  const [nameInput, setNameInput] = useState(
    organism.customName || localizedSpecies?.name || t.inspector.unknownName
  );

  const handleSaveName = () => {
    onRename(nameInput);
    setIsEditing(false);
  };

  const g = organism.genome;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.inspector.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-md flex flex-col gap-4 border text-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t.common.close}
          className="modal-close absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Microscope Icon & Name */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-black/50 border border-cyan-500/30 shadow-inner relative overflow-hidden shrink-0">
            {species ? (
              <CreaturePortrait species={species} size={64} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Droplet className="w-7 h-7 text-emerald-200" aria-label={t.inspector.unknownSpecies} />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-black/60 border border-cyan-400/50 rounded-lg px-2 py-0.5 text-sm font-bold text-white focus:outline-none"
                    maxLength={15}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    aria-label={t.inspector.saveName}
                    className="control-button p-2 rounded bg-emerald-500 text-black hover:bg-emerald-400"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white">
                    {organism.customName || localizedSpecies?.name}
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    aria-label={t.inspector.editName}
                    className="control-button p-2 text-slate-400 hover:text-emerald-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 italic font-mono">{species?.scientificName}</div>
            <div className="text-[11px] text-cyan-300 font-medium mt-0.5">
              {t.units.generation(organism.generation)} · {species?.trophicLevel.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Vitals & Status */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-2xl border border-white/5">
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{t.inspector.energy}</span>
            </div>
            <div className="font-mono font-bold text-amber-300 text-sm mt-0.5">
              {Math.round(organism.energy)} / {Math.round(organism.maxEnergy)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              <span>{t.inspector.age}</span>
            </div>
            <div className="font-mono font-bold text-rose-300 text-sm mt-0.5">
              {t.units.seconds(Math.round(organism.age))} / {t.units.seconds(Math.round(organism.lifespan))}
            </div>
          </div>
        </div>

        {/* 10-Dimensional Genetic Genome Analysis */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <div className="flex items-center gap-1.5">
              <Dna className="w-4 h-4" />
              <span>{t.inspector.genomeTitle}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">{t.inspector.genomeDimensions}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            {/* Size */}
            <div>
              <div className="text-slate-400 text-[10px]">{t.inspector.genome.size}</div>
              <div className="font-mono font-bold text-slate-200">{g.size}x</div>
            </div>

            {/* Speed */}
            <div>
              <div className="text-slate-400 text-[10px]">{t.inspector.genome.speed}</div>
              <div className="font-mono font-bold text-slate-200">{g.speed} m/s</div>
            </div>

            {/* Temp Opt */}
            <div>
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>{t.inspector.genome.tempOpt}</span>
              </div>
              <div className="font-mono font-bold text-orange-300">
                {g.tempOpt}°C <span className="text-[9px] text-slate-500">(±{g.tempTol}°)</span>
              </div>
            </div>

            {/* Moist Opt */}
            <div>
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Droplet className="w-3 h-3 text-cyan-400" />
                <span>{t.inspector.genome.moistOpt}</span>
              </div>
              <div className="font-mono font-bold text-cyan-300">{g.moistOpt}%</div>
            </div>

            {/* Defense */}
            <div>
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>{t.inspector.genome.defense}</span>
              </div>
              <div className="font-mono font-bold text-emerald-300">{Math.round(g.defense * 100)}%</div>
            </div>

            {/* Mutation Rate */}
            <div>
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>{t.inspector.genome.mutationRate}</span>
              </div>
              <div className="font-mono font-bold text-purple-300">{Math.round(g.mutationRate * 100)}%</div>
            </div>

            {/* Metabolism */}
            <div>
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Activity className="w-3 h-3 text-rose-400" />
                <span>{t.inspector.genome.metabolism}</span>
              </div>
              <div className="font-mono font-bold text-rose-300">{g.metabolism.toFixed(2)}x</div>
            </div>

            {/* Hue */}
            <div>
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Palette className="w-3 h-3 text-fuchsia-400" />
                <span>{t.inspector.genome.hue}</span>
              </div>
              <div className="font-mono font-bold flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: `hsl(${g.hue}, 70%, 60%)` }}
                />
                <span className="text-slate-200">{Math.round(g.hue)}°</span>
              </div>
            </div>

            {/* Bioluminescence */}
            <div>
              <div className="text-slate-400 text-[10px] flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>{t.inspector.genome.bioluminescence}</span>
              </div>
              <div className="font-mono font-bold text-amber-300">
                {Math.round(g.bioluminescence * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Direct Mutagen Injection */}
        <button
          onClick={onInjectMutagen}
          className="modal-primary-action w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.inspector.injectMutagen}</span>
        </button>
      </div>
    </div>
  );
};
