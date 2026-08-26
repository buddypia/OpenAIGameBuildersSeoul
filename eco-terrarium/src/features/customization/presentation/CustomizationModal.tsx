import React from 'react';
import { X, Palette, Sparkles, Layers, Image as ImageIcon, Circle, Gem, FlaskConical, Orbit, type LucideIcon } from 'lucide-react';
import { TerrariumCustomization, BottleShape, SubstrateType, BackgroundTheme } from '../../../shared/kernel/types';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  customization: TerrariumCustomization;
  onChange: (customization: TerrariumCustomization) => void;
  onClose: () => void;
}

export const CustomizationModal: React.FC<Props> = ({ customization, onChange, onClose }) => {
  const { t } = useI18n();
  const dialogRef = useDialog(onClose);
  // Ids, icons and swatches are presentation constants; the names and blurbs
  // beside them come from the locale catalogue.
  const bottleShapes: { id: BottleShape; Icon: LucideIcon }[] = [
    { id: 'classic-jar', Icon: Circle },
    { id: 'geometric-dome', Icon: Gem },
    { id: 'antique-flask', Icon: FlaskConical },
    { id: 'crystal-sphere', Icon: Orbit },
  ];

  const substrates: { id: SubstrateType; color: string }[] = [
    { id: 'moss-forest', color: '#166534' },
    { id: 'deep-sea-sand', color: '#0e7490' },
    { id: 'volcanic-obsidian', color: '#9a3412' },
    { id: 'crystal-cave', color: '#7e22ce' },
  ];

  const backgrounds: { id: BackgroundTheme; gradient: string }[] = [
    { id: 'cozy-lab', gradient: 'from-slate-900 to-amber-950/40' },
    { id: 'dawn-mist', gradient: 'from-cyan-950 to-emerald-950' },
    { id: 'sunset-window', gradient: 'from-orange-950 to-purple-950' },
    { id: 'cosmic-aurora', gradient: 'from-indigo-950 to-slate-950' },
  ];

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.customization.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col gap-5 border text-slate-100 relative overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.customization.title}</h2>
              <div className="text-xs text-slate-400">{t.customization.subtitle}</div>
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

        {/* Section 1: Bottle Shape */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{t.customization.bottleTitle}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {bottleShapes.map((b) => (
              <button
                key={b.id}
                onClick={() => onChange({ ...customization, bottleShape: b.id })}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all ${
                  customization.bottleShape === b.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <b.Icon className="w-6 h-6 text-emerald-200" aria-hidden="true" />
                <span className="text-xs font-bold">{t.customization.bottles[b.id].name}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">{t.customization.bottles[b.id].desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Substrate */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>{t.customization.substrateTitle}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {substrates.map((s) => (
              <button
                key={s.id}
                onClick={() => onChange({ ...customization, substrate: s.id })}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all ${
                  customization.substrate === s.id
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-bold">{t.customization.substrates[s.id].name}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">{t.customization.substrates[s.id].desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Background Theme */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" />
            <span>{t.customization.backgroundTitle}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onChange({ ...customization, background: bg.id })}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all ${
                  customization.background === bg.id
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`w-8 h-4 rounded-md bg-gradient-to-r ${bg.gradient} border border-white/10`} />
                <span className="text-xs font-bold">{t.customization.backgrounds[bg.id].name}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">{t.customization.backgrounds[bg.id].desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
