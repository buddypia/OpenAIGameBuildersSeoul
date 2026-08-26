import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Trophy,
  Users,
  Sparkles,
  Download,
  Gift,
} from 'lucide-react';
import { HiveEcosystemDNA, HiveLeaderboardEntry, EcosystemStats } from '../../../shared/kernel/types';
import { encodeEcosystemDNA, decodeEcosystemDNA, generateShortCode } from '../infrastructure/dnaCodec';
import { useI18n } from '../../i18n';
import { useDialog } from '../../../shared/ui/useDialog';

interface Props {
  currentDNA: HiveEcosystemDNA;
  stats: EcosystemStats;
  onImportDNA: (dna: HiveEcosystemDNA) => void;
  onGiftPollen: () => void;
  onHarvestSpore: (speciesId: string) => void;
  onClose: () => void;
}

/**
 * Placeholder leaderboard until the Hive SDK is wired up (REQUIREMENTS
 * FR-HIVE-03). Only the numbers live here; the names, terrarium titles and
 * badges come from the locale catalogue and are merged in at render time.
 */
const MOCK_LEADERBOARD_STATS = [
  { rank: 1, score: 985, discoveredCount: 16, ageMinutes: 48, ageSeconds: 20, dnaCode: 'ECO-98AF-A1' },
  { rank: 2, score: 920, discoveredCount: 14, ageMinutes: 35, ageSeconds: 10, dnaCode: 'ECO-7B2C-K9' },
  { rank: 3, score: 890, discoveredCount: 13, ageMinutes: 29, ageSeconds: 45, dnaCode: 'ECO-3E5D-M4' },
  { rank: 4, score: 845, discoveredCount: 11, ageMinutes: 22, ageSeconds: 15, dnaCode: 'ECO-1A9F-P8' },
];

export const HiveShareModal: React.FC<Props> = ({
  currentDNA,
  stats,
  onImportDNA,
  onGiftPollen,
  onHarvestSpore,
  onClose,
}) => {
  const { t } = useI18n();
  const dialogRef = useDialog(onClose);
  const [activeTab, setActiveTab] = useState<'share' | 'import' | 'leaderboard' | 'visitor'>('share');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [importError, setImportError] = useState('');
  const [pollenGifted, setPollenGifted] = useState(false);
  const [sporeHarvested, setSporeHarvested] = useState(false);

  const leaderboard: HiveLeaderboardEntry[] = MOCK_LEADERBOARD_STATS.map((entry, index) => ({
    ...entry,
    ...t.hive.leaderboard[index],
    ageFormatted: t.units.duration(entry.ageMinutes, entry.ageSeconds),
  }));

  const rawCompressedDNA = encodeEcosystemDNA(currentDNA);
  const shortCode = generateShortCode(rawCompressedDNA);
  const shareableUrl = `${window.location.origin}${window.location.pathname}?dna=${rawCompressedDNA}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shortCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleImport = () => {
    setImportError('');
    if (!inputCode.trim()) {
      setImportError(t.hive.importEmptyError);
      return;
    }

    // Accept a full shared URL (including optional tracking parameters) or a
    // raw compressed DNA string.
    let codeToParse = inputCode.trim();
    try {
      const sharedUrl = new URL(codeToParse);
      codeToParse = sharedUrl.searchParams.get('dna') || codeToParse;
    } catch {
      // Raw compressed DNA is not a URL and is decoded below.
    }

    const decoded = decodeEcosystemDNA(codeToParse);
    if (decoded) {
      onImportDNA(decoded);
      onClose();
    } else {
      setImportError(t.hive.importInvalidError);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t.hive.dialogLabel} tabIndex={-1} className="modal-surface rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col gap-4 border text-slate-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{t.hive.title}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live Connect
                </span>
              </div>
              <div className="text-xs text-slate-400">{t.hive.subtitle}</div>
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

        {/* Tab Buttons */}
        <div className="grid grid-cols-4 gap-1.5 text-xs bg-black/30 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('share')}
            className={`modal-option py-2 font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'share' ? 'modal-option-active' : ''
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t.hive.tabs.share}</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`modal-option py-2 font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'import' ? 'modal-option-active' : ''
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.hive.tabs.import}</span>
          </button>

          <button
            onClick={() => setActiveTab('visitor')}
            className={`modal-option py-2 font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'visitor' ? 'modal-option-active' : ''
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.hive.tabs.visitor}</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`modal-option py-2 font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'leaderboard' ? 'modal-option-active' : ''
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{t.hive.tabs.leaderboard}</span>
          </button>
        </div>

        {/* Tab 1: Share My Terrarium */}
        {activeTab === 'share' && (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">{t.hive.referenceId}</span>
                <span className="text-[10px] text-emerald-300 font-mono">{t.hive.dnaValid}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 border border-cyan-500/30 p-3 rounded-xl">
                <span className="font-mono font-bold text-base text-cyan-300 tracking-wider">
                  {shortCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs flex items-center gap-1 hover:bg-cyan-400 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? t.hive.copied : t.hive.copyCode}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.hive.referenceNote}
            </p>

            {/* Direct Web URL Share */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-300">{t.hive.deepLink}</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-slate-400 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center gap-1 hover:bg-emerald-400 shrink-0 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? t.hive.copied : t.hive.copyLink}</span>
                </button>
              </div>
            </div>

            {/* Live Stats Snapshot */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <div className="text-[10px] text-slate-400">{t.hive.snapshot.discovered}</div>
                <div className="font-mono font-bold text-emerald-300 text-sm mt-0.5">
                  {stats.unlockedSpeciesCount} / 16
                </div>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <div className="text-[10px] text-slate-400">{t.hive.snapshot.harmony}</div>
                <div className="font-mono font-bold text-indigo-300 text-sm mt-0.5">
                  {stats.bioHarmonyScore} pts
                </div>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
                <div className="text-[10px] text-slate-400">{t.hive.snapshot.population}</div>
                <div className="font-mono font-bold text-cyan-300 text-sm mt-0.5">
                  {t.units.organisms(stats.totalOrganisms)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Import DNA */}
        {activeTab === 'import' && (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="text-xs text-slate-300 leading-relaxed">
              {t.hive.importIntro}
            </div>

            <textarea
              rows={4}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={t.hive.importPlaceholder}
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-400/50 resize-none"
            />

            {importError && (
              <div className="modal-error text-xs p-3 rounded-xl border">
                {importError}
              </div>
            )}

            <button
              onClick={handleImport}
              className="modal-primary-action w-full py-3 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{t.hive.importAction}</span>
            </button>
          </div>
        )}

        {/* Tab 3: Visitor Mode */}
        {activeTab === 'visitor' && (
          <div className="flex flex-col gap-3 overflow-y-auto pr-1">
            <div className="bg-pink-950/20 border border-pink-500/20 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-pink-300">{t.hive.visitor.featured}</div>
                <div className="text-[11px] text-slate-400">{t.hive.visitor.featuredOwner}</div>
              </div>
              <Users className="w-6 h-6 text-emerald-300" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onGiftPollen();
                  setPollenGifted(true);
                  setTimeout(() => setPollenGifted(false), 2500);
                }}
                disabled={pollenGifted}
                className="py-3 px-4 rounded-2xl bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 text-amber-200 font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <Gift className="w-5 h-5 text-amber-400" />
                <span>{pollenGifted ? t.hive.visitor.giftPollenDone : t.hive.visitor.giftPollen}</span>
                <span className="text-[10px] text-slate-400 font-normal">{t.hive.visitor.giftPollenDesc}</span>
              </button>

              <button
                onClick={() => {
                  onHarvestSpore('aurora_fin');
                  setSporeHarvested(true);
                  setTimeout(() => setSporeHarvested(false), 2500);
                }}
                disabled={sporeHarvested}
                className="py-3 px-4 rounded-2xl bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 text-purple-200 font-semibold flex flex-col items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>{sporeHarvested ? t.hive.visitor.harvestSporeDone : t.hive.visitor.harvestSpore}</span>
                <span className="text-[10px] text-slate-400 font-normal">{t.hive.visitor.harvestSporeDesc}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Global Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="bg-black/30 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl font-bold flex items-center justify-center font-mono ${
                      entry.rank === 1
                        ? 'bg-amber-400 text-black shadow-md'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-black'
                        : entry.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {entry.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{entry.playerName}</span>
                      <span className="text-[10px] text-slate-400">({entry.terrariumName})</span>
                    </div>
                    <div className="text-[10px] text-amber-300 font-medium">{entry.badge}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-cyan-300 text-sm">{entry.score} pts</div>
                  <div className="text-[10px] text-slate-400">
                    {t.units.speciesCount(entry.discoveredCount)} · {entry.ageFormatted}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
