import React, { useState } from 'react';
import { X, HelpCircle, Sun, Droplets, Thermometer, Sparkles, Hand, Search, Compass, Leaf, Bug, Crosshair, Network, RotateCcw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  onClose: () => void;
  onReset: () => void;
}

export const HelpGuideModal: React.FC<Props> = ({ onClose, onReset }) => {
  const { t } = useI18n();
  const dialogRef = useDialog(onClose);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleConfirmReset = () => {
    onReset();
    setIsConfirmingReset(false);
    onClose();
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.help.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col gap-4 border text-slate-100 relative overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.help.title}</h2>
              <div className="text-xs text-slate-400">{t.help.subtitle}</div>
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

        {/* Cover Banner */}
        <div className="w-full h-32 rounded-2xl overflow-hidden relative border border-white/10 shrink-0">
          <img
            src="/cover.jpg"
            alt="Eco Terrarium Cover"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-3">
            <div className="text-xs font-bold text-emerald-300 font-mono">
              Eco Terrarium · Micro Evolution
            </div>
          </div>
        </div>

        {/* 1. Core Loop */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            <span>{t.help.loopTitle}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t.help.loopBody}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-center mt-1">
            <div className="bg-emerald-950/40 border border-emerald-500/20 p-2 rounded-xl text-emerald-300 flex flex-col items-center gap-1">
              <Leaf className="w-4 h-4" aria-hidden="true" /><span>{t.stats.trophic.producer}</span><span className="text-[10px] text-slate-400 font-sans">{t.help.loopRoles.producer}</span>
            </div>
            <div className="bg-pink-950/40 border border-pink-500/20 p-2 rounded-xl text-pink-300 flex flex-col items-center gap-1">
              <Bug className="w-4 h-4" aria-hidden="true" /><span>{t.stats.trophic.herbivore}</span><span className="text-[10px] text-slate-400 font-sans">{t.help.loopRoles.herbivore}</span>
            </div>
            <div className="bg-purple-950/40 border border-purple-500/20 p-2 rounded-xl text-purple-300 flex flex-col items-center gap-1">
              <Crosshair className="w-4 h-4" aria-hidden="true" /><span>{t.stats.trophic.predator}</span><span className="text-[10px] text-slate-400 font-sans">{t.help.loopRoles.predator}</span>
            </div>
            <div className="bg-amber-950/40 border border-amber-500/20 p-2 rounded-xl text-amber-300 flex flex-col items-center gap-1">
              <Network className="w-4 h-4" aria-hidden="true" /><span>{t.stats.trophic.decomposer}</span><span className="text-[10px] text-slate-400 font-sans">{t.help.loopRoles.decomposer}</span>
            </div>
          </div>
        </div>

        {/* 2. God Tools */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
          <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{t.help.toolsTitle}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl">
              <Sun className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">{t.help.tools.sunlight.name}</strong>: {t.help.tools.sunlight.desc}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl">
              <Droplets className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-300">{t.help.tools.moisture.name}</strong>: {t.help.tools.moisture.desc}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl">
              <Thermometer className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300">{t.help.tools.temperature.name}</strong>: {t.help.tools.temperature.desc}
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl">
              <Hand className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">{t.help.tools.tap.name}</strong>: {t.help.tools.tap.desc}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Speciation & Sound */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5 text-xs">
          <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            <span>{t.help.speciationTitle}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {t.help.speciationBody}
          </p>
        </div>

        {/* 4. Save & Reset */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" />
            <span>{t.help.saveTitle}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {t.help.saveBody}
          </p>

          {isConfirmingReset ? (
            <div className="flex flex-col gap-2 bg-rose-950/40 border border-rose-500/30 rounded-xl p-3">
              <div className="flex items-start gap-2 text-rose-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{t.help.resetWarning}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmReset}
                  className="control-button flex-1 py-2 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-400 transition-colors"
                >
                  {t.help.resetConfirm}
                </button>
                <button
                  onClick={() => setIsConfirmingReset(false)}
                  className="control-button flex-1 py-2 rounded-xl bg-white/10 text-slate-200 font-semibold hover:bg-white/20 transition-colors"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingReset(true)}
              className="control-button self-start px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.help.resetTrigger}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
