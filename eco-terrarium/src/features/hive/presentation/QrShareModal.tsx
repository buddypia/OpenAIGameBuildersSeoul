import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Smartphone, Info } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';
import { PUBLIC_PLAY_URL } from '../domain/qrCode';
import { QrCodeArt } from './QrCodeArt';
import { usePlayUrl } from './usePlayUrl';

interface Props {
  onClose: () => void;
}

/**
 * 관객이 자기 폰으로 게임을 여는 통로.
 *
 * QR은 SVG 한 장으로 그린다. 이미지 파일도, 외부 QR 생성 서비스도 쓰지 않기
 * 때문에 인터넷이 끊긴 행사장에서도 그대로 뜨고, 프로젝터로 확대해도 깨지지
 * 않는다.
 */
export const QrShareModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const dialogRef = useDialog(onClose);
  const [copied, setCopied] = useState(false);

  const href = typeof window === 'undefined' ? null : window.location.href;
  const playUrl = usePlayUrl();

  const isFallback = playUrl.startsWith(PUBLIC_PLAY_URL) && !(href ?? '').startsWith(PUBLIC_PLAY_URL);

  const handleCopy = () => {
    navigator.clipboard?.writeText(playUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false)
    );
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.qr.dialogLabel}
        tabIndex={-1}
        className="modal-surface rounded-3xl p-6 w-full max-w-md flex flex-col gap-4 border text-slate-100"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.qr.title}</h2>
              <div className="text-xs text-slate-400">{t.qr.subtitle}</div>
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

        <div className="self-center rounded-2xl bg-white p-3 shadow-lg">
          <QrCodeArt value={playUrl} className="block h-56 w-56 sm:h-64 sm:w-64" />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
          <Smartphone className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
          <span>{t.qr.scanHint}</span>
        </div>

        {isFallback && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-2.5 text-[11px] leading-relaxed text-amber-200">
            <Info className="mt-0.5 w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t.qr.localNotice}</span>
          </div>
        )}

        <div className="glass-panel rounded-2xl border border-white/10 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t.qr.urlLabel}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-black/40 px-2.5 py-1.5 font-mono text-xs text-emerald-200">
              {playUrl}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.qr.copied : t.qr.copyLink}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
