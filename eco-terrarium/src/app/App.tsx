import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Award,
  Palette,
  Camera,
  Globe,
  HelpCircle,
  Leaf,
  Zap,
} from 'lucide-react';

import {
  EnvironmentState,
  TerrariumCustomization,
  EcosystemStats,
  Organism,
  SpeciesInfo,
  HiveEcosystemDNA,
} from '../shared/kernel';
import {
  EcosystemEngine,
  EnvironmentHUD,
  StatsPanel,
  TerrariumCanvas,
  TerrariumRenderer,
  type ActiveTool,
} from '../features/ecosystem';
import { AudioEngine } from '../features/audio';
import { EncyclopediaModal, InspectorModal } from '../features/species';
import { INITIAL_QUESTS, QuestsModal } from '../features/progression';
import { CustomizationModal } from '../features/customization';
import { PhotoModal } from '../features/photo';
import {
  clearEcosystemLocally,
  decodeEcosystemDNA,
  HiveShareModal,
  loadEcosystemLocally,
  saveEcosystemLocally,
} from '../features/hive';
import { JudgeShowcaseModal } from '../features/showcase';
import { HelpGuideModal, StartScreen } from '../features/onboarding';
import { I18nProvider, LanguageToggle, useI18n } from '../features/i18n';

const TerrariumApp: React.FC = () => {
  const { t, speciesText } = useI18n();
  // 1. Environment & Customization State
  const [env, setEnv] = useState<EnvironmentState>({
    sunlight: 65,
    moisture: 60,
    temperature: 22,
    nutrients: 55,
    dayNightCycle: 0.2,
    autoDayNight: true,
    timeSpeed: 1,
  });

  const [customization, setCustomization] = useState<TerrariumCustomization>({
    bottleShape: 'classic-jar',
    substrate: 'moss-forest',
    background: 'cozy-lab',
  });

  // 2. Core Engine & Audio Engine Singleton Instances
  const audioEngine = useMemo(() => new AudioEngine(), []);
  const renderer = useMemo(() => new TerrariumRenderer(), []);

  const [discoveredSpeciesNotice, setDiscoveredSpeciesNotice] = useState<SpeciesInfo | null>(null);

  const engine = useMemo(() => {
    return new EcosystemEngine({
      onSpeciesUnlocked: (sp) => {
        setDiscoveredSpeciesNotice(sp);
      },
      onAudioEvent: (type, pitch) => {
        audioEngine.playBioSound(type, pitch);
      },
    });
  }, [audioEngine]);

  // 3. UI State & Modals
  const [activeTool, setActiveTool] = useState<ActiveTool>('inspect');
  const [selectedOrganism, setSelectedOrganism] = useState<Organism | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isHiveShareOpen, setIsHiveShareOpen] = useState(false);
  const [isJudgeShowcaseOpen, setIsJudgeShowcaseOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const [quests, setQuests] = useState(INITIAL_QUESTS);
  const [stats, setStats] = useState<EcosystemStats>(engine.getStats());
  const envRef = useRef(env);

  useEffect(() => {
    envRef.current = env;
  }, [env]);

  const restoreDNA = (dna: HiveEcosystemDNA) => {
    engine.restoreFromDNA(dna);
    setEnv(dna.env);
    setCustomization(dna.customization);
    setSelectedOrganism(null);
    setStats(engine.getStats());
  };

  // Discards the save first, so a failure midway through the reset cannot leave
  // the old terrarium on disk to be restored on the next visit.
  const handleResetTerrarium = () => {
    clearEcosystemLocally();
    engine.reset();
    setEnv({
      sunlight: 65,
      moisture: 60,
      temperature: 22,
      nutrients: 55,
      dayNightCycle: 0.2,
      autoDayNight: true,
      timeSpeed: 1,
    });
    setCustomization({
      bottleShape: 'classic-jar',
      substrate: 'moss-forest',
      background: 'cozy-lab',
    });
    setQuests(INITIAL_QUESTS.map((quest) => ({ ...quest, completed: false })));
    setSelectedOrganism(null);
    setDiscoveredSpeciesNotice(null);
    setStats(engine.getStats());
  };

  // 4. Species Map for Quick Lookup
  const speciesMap = useMemo(() => {
    const map = new Map<string, SpeciesInfo>();
    engine.speciesList.forEach((s) => map.set(s.id, s));
    return map;
  }, [engine.speciesList]);

  // Restore on mount. A shared deep link always wins over the local autosave so
  // that opening someone else's terrarium shows theirs, not the visitor's own.
  // `code` is accepted as an alias for the original `dna` parameter name.
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sharedParam = searchParams.get('dna') ?? searchParams.get('code');
    if (sharedParam) {
      const decoded = decodeEcosystemDNA(sharedParam);
      if (decoded) {
        restoreDNA(decoded);
        return;
      }
    }

    const saved = loadEcosystemLocally();
    if (!saved) return;
    restoreDNA(saved.dna);
    const completedIds = new Set(saved.completedQuestIds);
    setQuests((prev) =>
      prev.map((quest) => (completedIds.has(quest.id) ? { ...quest, completed: true } : quest))
    );
  }, []);

  // Periodic Stats & Quest Evaluation Loop
  useEffect(() => {
    const timer = setInterval(() => {
      // Advance Day / Night Cycle if enabled
      const currentEnv = envRef.current;
      if (currentEnv.autoDayNight && currentEnv.timeSpeed > 0) {
        setEnv((prev) => ({
          ...prev,
          dayNightCycle: (prev.dayNightCycle + 0.002 * prev.timeSpeed) % 1,
        }));
      }

      const currentStats = engine.getStats();
      setStats(currentStats);
      audioEngine.updateState(currentEnv, currentStats);

      // Check Quests
      setQuests((prevQuests) =>
        prevQuests.map((q) => {
          if (q.completed) return q;
          if (q.check(currentStats, currentEnv, engine.history)) {
            return { ...q, completed: true };
          }
          return q;
        })
      );
    }, 500);

    return () => clearInterval(timer);
  }, [engine, audioEngine]);

  // Start Audio Engine on first interaction
  const handleUserInteraction = () => {
    audioEngine.init();
  };

  const handleStartGame = () => {
    handleUserInteraction();
    setIsGameStarted(true);
  };

  // Preset Handler for Judge Showcase
  const handleLoadPreset = (preset: 'prosperity' | 'mutation' | 'iceage' | 'symphony') => {
    if (preset === 'prosperity') {
      setEnv({
        sunlight: 65,
        moisture: 65,
        temperature: 23,
        nutrients: 60,
        dayNightCycle: 0.2,
        autoDayNight: true,
        timeSpeed: 1,
      });
      engine.seedInitialEcosystem();
    } else if (preset === 'mutation') {
      setEnv({
        sunlight: 85,
        moisture: 75,
        temperature: 36,
        nutrients: 80,
        dayNightCycle: 0.2,
        autoDayNight: false,
        timeSpeed: 2,
      });
      for (let i = 0; i < 6; i++) {
        engine.addFoodPellet('mutagen', Math.random() * 400 + 200, Math.random() * 200 + 150);
      }
    } else if (preset === 'iceage') {
      setEnv({
        sunlight: 30,
        moisture: 40,
        temperature: -6,
        nutrients: 45,
        dayNightCycle: 0.6,
        autoDayNight: false,
        timeSpeed: 1,
      });
      setCustomization((prev) => ({ ...prev, substrate: 'crystal-cave', background: 'cosmic-aurora' }));
    } else if (preset === 'symphony') {
      setEnv({
        sunlight: 70,
        moisture: 70,
        temperature: 24,
        nutrients: 70,
        dayNightCycle: 0.25,
        autoDayNight: true,
        timeSpeed: 1,
      });
    }
  };

  const currentDNA: HiveEcosystemDNA = {
    version: '1.1.0',
    creatorName: t.dna.defaultCreatorName,
    terrariumName: t.dna.defaultTerrariumName,
    timestamp: Date.now(),
    env,
    customization,
    speciesUnlocked: engine.speciesList.filter((s) => s.unlocked).map((s) => s.id),
    stats: {
      totalAge: stats.simulationAgeSeconds,
      highestScore: stats.bioHarmonyScore,
      discoveredCount: stats.unlockedSpeciesCount,
    },
    organisms: engine.organisms.slice(0, 100).map((o) => ({
      speciesId: o.speciesId,
      genome: o.genome,
      generation: o.generation,
      customName: o.customName,
    })),
  };

  // Autosave reads through a ref so the interval never captures a stale
  // ecosystem and never has to be torn down on every state change.
  const saveStateRef = useRef({ dna: currentDNA, quests });
  useEffect(() => {
    saveStateRef.current = { dna: currentDNA, quests };
  });

  // Persistence only starts once the player is actually in the game, otherwise
  // the start screen would overwrite a real save with a freshly seeded jar.
  useEffect(() => {
    if (!isGameStarted) return;

    const persist = () => {
      const { dna, quests: currentQuests } = saveStateRef.current;
      saveEcosystemLocally({
        dna,
        completedQuestIds: currentQuests.filter((quest) => quest.completed).map((quest) => quest.id),
        savedAt: Date.now(),
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persist();
    };

    const timer = setInterval(persist, 10000);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      persist();
    };
  }, [isGameStarted]);

  const unlockedCount = engine.speciesList.filter((s) => s.unlocked).length;
  const completedQuestCount = quests.filter((q) => q.completed).length;

  return (
    <div
      onClick={handleUserInteraction}
      className="app-shell w-full min-h-[100dvh] flex flex-col bg-eco-bg text-slate-100 font-sans select-none lg:h-[100dvh] lg:overflow-hidden"
    >
      {/* Top Main Navigation Bar */}
      <header className="app-topbar px-3 py-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
        {/* Title & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <div className="brand-mark" aria-hidden="true">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-sm md:text-base font-bold tracking-[-0.025em] text-white flex items-baseline gap-2">
              <span className="truncate">{t.topbar.title}</span>
              <span className="text-[10px] font-medium text-emerald-200/60 hidden md:inline">Micro Evolution</span>
            </h1>
            <div className="text-[11px] text-slate-400 hidden lg:block">
              {t.topbar.subtitle}
            </div>
          </div>
        </div>

        {/* Action Button Ribbon */}
        <nav aria-label={t.topbar.navLabel} className="topbar-actions flex items-center gap-1.5 shrink-0">
          {/* Judge Quick Showcase Button (High Priority Golden Shimmer) */}
          <button
            onClick={() => setIsJudgeShowcaseOpen(true)}
            className="topbar-action topbar-action-primary"
          >
            <Zap className="hidden sm:block w-4 h-4" />
            <span className="sm:hidden">{t.topbar.judgeShort}</span>
            <span className="hidden sm:inline">{t.topbar.judgeFull}</span>
          </button>

          {/* Encyclopedia */}
          <button
            onClick={() => setIsEncyclopediaOpen(true)}
            className="topbar-action relative"
            title={t.topbar.encyclopediaTitle}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">{t.topbar.encyclopedia}</span>
            <span className="status-count">
              {unlockedCount}/16
            </span>
          </button>

          {/* Quests */}
          <button
            onClick={() => setIsQuestsOpen(true)}
            className="topbar-action hidden sm:flex"
            title={t.topbar.questsTitle}
          >
            <Award className="w-4 h-4" />
            <span className="hidden md:inline">{t.topbar.quests}</span>
            <span className="status-count">
              {completedQuestCount}
            </span>
          </button>

          {/* Customization */}
          <button
            onClick={() => setIsCustomizationOpen(true)}
            className="topbar-action"
            title={t.topbar.customizationTitle}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden md:inline">{t.topbar.customization}</span>
          </button>

          {/* Photo */}
          <button
            onClick={() => setIsPhotoOpen(true)}
            className="topbar-action"
            title={t.topbar.photoTitle}
          >
            <Camera className="w-4 h-4" />
            <span className="hidden md:inline">{t.topbar.photo}</span>
          </button>

          {/* Hive Share */}
          <button
            onClick={() => setIsHiveShareOpen(true)}
            className="topbar-action hidden sm:flex"
            title={t.topbar.hiveTitle}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden md:inline">{t.topbar.hive}</span>
          </button>

          {/* Guide */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="topbar-action topbar-icon-action"
            title={t.topbar.helpTitle}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Language */}
          <LanguageToggle />
        </nav>
      </header>

      {/* Main Workspace Body: Left Canvas & Right Controls */}
      <main className="workspace flex-1 flex flex-col lg:flex-row p-3 sm:p-4 gap-3 lg:overflow-hidden min-h-0">
        {/* Left Side: Terrarium Canvas Container */}
        <section className="flex-1 min-h-[360px] lg:h-full flex flex-col relative">
          <TerrariumCanvas
            engine={engine}
            renderer={renderer}
            env={env}
            customization={customization}
            speciesMap={speciesMap}
            activeTool={activeTool}
            selectedOrganism={selectedOrganism}
            ecosystemHealth={stats.ecosystemHealth}
            onSelectOrganism={(org) => setSelectedOrganism(org)}
            onCanvasClickFeedback={handleUserInteraction}
            isSimulationActive={isGameStarted}
          />
        </section>

        {/* Right Side: Environment HUD & Ecological Statistics Panel */}
        <aside className="control-rail w-full lg:w-[440px] xl:w-[480px] flex flex-col gap-3 lg:overflow-y-auto lg:pr-1 shrink-0">
          <EnvironmentHUD
            env={env}
            onEnvChange={(newEnv) => setEnv((prev) => ({ ...prev, ...newEnv }))}
            activeTool={activeTool}
            onSelectTool={(tool) => setActiveTool(tool)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(audioEngine.toggleMute())}
          />

          <StatsPanel stats={stats} history={engine.history} env={env} />
        </aside>
      </main>

      {/* New Species Discovered Toast Banner */}
      {discoveredSpeciesNotice && (
        <div className="species-notice fixed bottom-5 left-3 right-3 sm:left-1/2 sm:right-auto sm:w-max sm:-translate-x-1/2 z-50 px-4 py-3 flex items-center gap-3">
          <span className="text-3xl">{discoveredSpeciesNotice.iconEmoji}</span>
          <div>
            <div className="text-[10px] text-emerald-300 font-semibold">
              {t.discovery.kicker}
            </div>
            <div className="text-sm font-bold text-white">
              {speciesText(discoveredSpeciesNotice).name} ({discoveredSpeciesNotice.scientificName})
            </div>
          </div>
          <button
            onClick={() => {
              setDiscoveredSpeciesNotice(null);
              setIsEncyclopediaOpen(true);
            }}
            className="notice-action px-3 py-2 text-xs font-semibold ml-auto"
          >
            {t.discovery.action}
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedOrganism && (
        <InspectorModal
          organism={selectedOrganism}
          species={speciesMap.get(selectedOrganism.speciesId)}
          onClose={() => setSelectedOrganism(null)}
          onRename={(newName) => {
            selectedOrganism.customName = newName;
          }}
          onInjectMutagen={() => {
            engine.addFoodPellet('mutagen', selectedOrganism.x, selectedOrganism.y);
          }}
        />
      )}

      {isEncyclopediaOpen && (
        <EncyclopediaModal
          speciesList={engine.speciesList}
          onClose={() => setIsEncyclopediaOpen(false)}
        />
      )}

      {isQuestsOpen && <QuestsModal quests={quests} onClose={() => setIsQuestsOpen(false)} />}

      {isCustomizationOpen && (
        <CustomizationModal
          customization={customization}
          onChange={(newCustom) => setCustomization(newCustom)}
          onClose={() => setIsCustomizationOpen(false)}
        />
      )}

      {isPhotoOpen && <PhotoModal onClose={() => setIsPhotoOpen(false)} />}

      {isHiveShareOpen && (
        <HiveShareModal
          currentDNA={currentDNA}
          stats={stats}
          onImportDNA={(dna) => {
            restoreDNA(dna);
          }}
          onGiftPollen={() => {
            for (let i = 0; i < 5; i++) {
              engine.addFoodPellet('nutrient', Math.random() * 400 + 200, Math.random() * 200 + 150);
            }
          }}
          onHarvestSpore={(speciesId) => {
            engine.spawnOrganism(speciesId, undefined, undefined, 2);
          }}
          onClose={() => setIsHiveShareOpen(false)}
        />
      )}

      {isJudgeShowcaseOpen && (
        <JudgeShowcaseModal
          onLoadPreset={handleLoadPreset}
          onClose={() => setIsJudgeShowcaseOpen(false)}
        />
      )}

      {isHelpOpen && (
        <HelpGuideModal onClose={() => setIsHelpOpen(false)} onReset={handleResetTerrarium} />
      )}

      {!isGameStarted && <StartScreen onStart={handleStartGame} />}
    </div>
  );
};

// The provider wraps the terrarium rather than living inside it, so switching
// language re-renders the whole tree without remounting the simulation engine.
export const App: React.FC = () => (
  <I18nProvider>
    <TerrariumApp />
  </I18nProvider>
);
