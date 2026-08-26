import React, { useState, useEffect } from 'react';
import { X, Camera, Download, Sliders } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  onClose: () => void;
}

type PhotoFilter = 'original' | 'vintage' | 'neon' | 'pastel' | 'noir';

export const PhotoModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const dialogRef = useDialog(onClose);
  const [snapshotUrl, setSnapshotUrl] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>('original');

  useEffect(() => {
    // Capture from main canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      setSnapshotUrl(canvas.toDataURL('image/png'));
    }
  }, []);

  const getFilterStyle = (filter: PhotoFilter): React.CSSProperties => {
    switch (filter) {
      case 'vintage':
        return { filter: 'sepia(0.35) contrast(1.1) brightness(0.95) saturate(1.2)' };
      case 'neon':
        return { filter: 'contrast(1.4) saturate(1.8) hue-rotate(15deg)' };
      case 'pastel':
        return { filter: 'brightness(1.15) saturate(0.85) contrast(0.9)' };
      case 'noir':
        return { filter: 'grayscale(1) contrast(1.3)' };
      default:
        return {};
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `eco-terrarium-snapshot-${Date.now()}.png`;
    link.href = snapshotUrl;
    link.click();
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.photo.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-xl flex flex-col gap-4 border text-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.photo.title}</h2>
              <div className="text-xs text-slate-400">{t.photo.subtitle}</div>
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

        {/* Snapshot Image Preview */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner flex items-center justify-center">
          {snapshotUrl ? (
            <img
              src={snapshotUrl}
              alt="Terrarium Snapshot"
              className="w-full h-full object-cover transition-all duration-300"
              style={getFilterStyle(selectedFilter)}
            />
          ) : (
            <span className="text-xs text-slate-500">{t.photo.loading}</span>
          )}

          {/* Watermark */}
          <div className="absolute bottom-3 right-4 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-lg pointer-events-none">
            <span>Eco Terrarium</span>
            <span className="text-slate-500">|</span>
            <span>Micro Evolution</span>
          </div>
        </div>

        {/* Filters Carousel */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-pink-400" />
            <span>{t.photo.filtersTitle}</span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-xs">
            {(['original', 'vintage', 'neon', 'pastel', 'noir'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                  selectedFilter === filter
                    ? 'bg-pink-500/20 border-pink-400 text-white font-bold shadow-md'
                    : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] line-clamp-1">{t.photo.filters[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Download Action Button */}
        <button
          onClick={handleDownload}
          className="modal-primary-action w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 mt-1"
        >
          <Download className="w-4 h-4" />
          <span>{t.photo.download}</span>
        </button>
      </div>
    </div>
  );
};
