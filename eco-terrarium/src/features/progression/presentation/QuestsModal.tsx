import React from 'react';
import { X, Award, CheckCircle2, Circle, Gift } from 'lucide-react';
import { Quest } from '../../../shared/kernel/types';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  quests: Quest[];
  onClose: () => void;
}

export const QuestsModal: React.FC<Props> = ({ quests, onClose }) => {
  const { t, questText } = useI18n();
  const dialogRef = useDialog(onClose);
  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.quests.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col gap-4 border text-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.quests.title}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t.quests.progress(
                    completedCount,
                    quests.length,
                    Math.round((completedCount / quests.length) * 100)
                  )}
                </span>
              </h2>
              <div className="text-xs text-slate-400">{t.quests.subtitle}</div>
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

        {/* Quests List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1">
          {quests.map((q) => {
            const questCopy = questText(q);
            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  q.completed
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : 'bg-black/30 border-white/5'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5 shrink-0">
                    {q.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${q.completed ? 'text-emerald-200 line-through' : 'text-white'}`}>
                        {questCopy.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase">
                        {q.category}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">{questCopy.description}</div>

                    {/* Reward tag */}
                    <div className="flex items-center gap-1 text-[11px] text-amber-300 font-medium mt-1">
                      <Gift className="w-3.5 h-3.5" />
                      <span>{t.quests.reward(questCopy.rewardTitle)}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {q.completed ? (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {t.quests.completed}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-white/5">
                      {t.quests.inProgress}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
