import React, { useState } from 'react';
import { ChevronDown, Maximize2, QrCode } from 'lucide-react';
import { useI18n } from '../../i18n';
import { QrCodeArt } from './QrCodeArt';
import { usePlayUrl } from './usePlayUrl';

interface Props {
  /** 프로젝터용 확대 보기. 기존 QR 모달을 연다. */
  onExpand: () => void;
}

/**
 * 캔버스 위에 늘 떠 있는 QR 배지.
 *
 * 부스에 선 관객이 버튼을 누를 필요 없이 바로 폰으로 스캔해 들어오게 하는 게
 * 목적이라, 상단바 버튼과 달리 항상 펼쳐진 상태로 시작한다. 스캔 가능한
 * 크기를 유지해야 해서 좁은 화면에서는 아예 띄우지 않는다 — 폰으로 들어온
 * 사람에게는 자기 자신을 가리키는 QR이고, 캔버스만 가린다.
 */
export const QrPlayBadge: React.FC<Props> = ({ onExpand }) => {
  const { t } = useI18n();
  const playUrl = usePlayUrl();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="qr-badge-restore absolute bottom-4 right-4 z-20 hidden lg:flex items-center gap-2 px-3 py-2"
        title={t.qr.badgeExpand}
      >
        <QrCode className="w-4 h-4" aria-hidden="true" />
        <span className="text-[11px] font-bold">{t.qr.badgeLabel}</span>
      </button>
    );
  }

  return (
    <div className="qr-badge absolute bottom-4 right-4 z-20 hidden lg:flex flex-col items-center gap-2 p-3">
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-emerald-200">{t.qr.badgeLabel}</span>
        <button
          onClick={() => setIsCollapsed(true)}
          aria-label={t.qr.badgeCollapse}
          title={t.qr.badgeCollapse}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        onClick={onExpand}
        title={t.qr.badgeEnlarge}
        className="qr-badge-code group relative rounded-xl bg-white p-2"
      >
        <QrCodeArt value={playUrl} className="block h-28 w-28" />
        <span className="qr-badge-zoom absolute inset-0 grid place-items-center rounded-xl opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
      </button>

      <span className="text-[10px] leading-tight text-slate-400">{t.qr.badgeHint}</span>
    </div>
  );
};
