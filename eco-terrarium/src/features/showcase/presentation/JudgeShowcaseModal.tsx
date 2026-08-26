import React, { useState } from 'react';
import { X, Award, Zap, Flame, Snowflake, Music, Bot, CheckCircle2, Code2, FlaskConical, Leaf } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  onLoadPreset: (preset: 'prosperity' | 'mutation' | 'iceage' | 'symphony') => void;
  onClose: () => void;
}

export const JudgeShowcaseModal: React.FC<Props> = ({ onLoadPreset, onClose }) => {
  const { t } = useI18n();
  const dialogRef = useDialog(onClose);
  const [activeTab, setActiveTab] = useState<'presets' | 'codex'>('presets');
  const [presetNotice, setPresetNotice] = useState<string>('');
  const presets = t.showcase.presets;
  const codex = t.showcase.codex;

  const handleApply = (preset: 'prosperity' | 'mutation' | 'iceage' | 'symphony') => {
    onLoadPreset(preset);
    setPresetNotice(t.showcase.presetApplied(presets[preset].name));
    setTimeout(() => setPresetNotice(''), 3000);
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.showcase.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-3xl max-h-[88vh] flex flex-col gap-4 border text-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{t.showcase.title}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Judges Only
                </span>
              </div>
              <div className="text-xs text-slate-400">{t.showcase.subtitle}</div>
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'presets'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{t.showcase.tabPresets}</span>
          </button>

          <button
            onClick={() => setActiveTab('codex')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'codex'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{t.showcase.tabCodex}</span>
          </button>
        </div>

        {presetNotice && (
          <div className="text-xs text-emerald-300 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{presetNotice}</span>
          </div>
        )}

        {/* Content Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
            {/* Preset 1: Instant Prosperity */}
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-300">{presets.prosperity.heading}</h3>
                    <div className="text-[10px] text-slate-400">{presets.prosperity.caption}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {presets.prosperity.body}
                </p>
              </div>

              <button
                onClick={() => handleApply('prosperity')}
                className="w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t.showcase.applyPreset}</span>
              </button>
            </div>

            {/* Preset 2: Mutation Burst */}
            <div className="glass-panel p-4 rounded-2xl border border-pink-500/30 flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-300">{presets.mutation.heading}</h3>
                    <div className="text-[10px] text-slate-400">{presets.mutation.caption}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {presets.mutation.body}
                </p>
              </div>

              <button
                onClick={() => handleApply('mutation')}
                className="modal-option w-full py-2 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{t.showcase.applyPreset}</span>
              </button>
            </div>

            {/* Preset 3: Ice Age */}
            <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-300">{presets.iceage.heading}</h3>
                    <div className="text-[10px] text-slate-400">{presets.iceage.caption}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {presets.iceage.body}
                </p>
              </div>

              <button
                onClick={() => handleApply('iceage')}
                className="modal-option w-full py-2 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>{t.showcase.applyPreset}</span>
              </button>
            </div>

            {/* Preset 4: Full Symphony */}
            <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-300">{presets.symphony.heading}</h3>
                    <div className="text-[10px] text-slate-400">{presets.symphony.caption}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {presets.symphony.body}
                </p>
              </div>

              <button
                onClick={() => handleApply('symphony')}
                className="modal-option w-full py-2 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Music className="w-3.5 h-3.5" />
                <span>{t.showcase.applyPreset}</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Tab 2: Codex AI Story */}
        {activeTab === 'codex' && (
          <div className="flex flex-col gap-3.5 overflow-y-auto pr-1 text-xs">
            {/* Visual Card */}
            <div className="w-full h-28 rounded-2xl overflow-hidden relative border border-white/10 shrink-0">
              <img
                src="/cover.jpg"
                alt="OpenAI Codex Collaboration"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-3">
                <div className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>Build with OpenAI Codex · Play with Com2uS Hive</span>
                </div>
              </div>
            </div>

            {/* Section 1: Where */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                <span>{codex.whereTitle}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {codex.whereItems.map((item) => (
                  <React.Fragment key={item.term}>
                    • <strong>{item.term}</strong>: {item.body}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>

            {/* Section 2: Problem Solving */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                <span>{codex.problemTitle}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {codex.problemItems.map((item) => (
                  <React.Fragment key={item.term}>
                    • <strong>{item.term}</strong>: {item.body}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>

            {/* Section 3: Human Creator Decision */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>{codex.decisionTitle}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{codex.decisionBody}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
