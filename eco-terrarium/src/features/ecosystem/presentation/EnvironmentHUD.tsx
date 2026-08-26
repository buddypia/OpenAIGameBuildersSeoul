import React from 'react';
import {
  Sun,
  Droplets,
  Thermometer,
  Sparkles,
  FlaskConical,
  Hand,
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Moon,
  Zap,
  MousePointerClick,
} from 'lucide-react';
import { EnvironmentState } from '../../../shared/kernel/types';
import { useI18n } from '../../i18n';
import { getEnvironmentReading } from '../domain/ecosystemGuidance';

export type ActiveTool = 'inspect' | 'feed' | 'mutagen' | 'tap';

interface Props {
  env: EnvironmentState;
  onEnvChange: (newEnv: Partial<EnvironmentState>) => void;
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const EnvironmentHUD: React.FC<Props> = ({
  env,
  onEnvChange,
  activeTool,
  onSelectTool,
  isMuted,
  onToggleMute,
}) => {
  const { t } = useI18n();
  const tools = t.hud.tools;
  const sliders = t.hud.sliders;
  const toolGuide = tools[activeTool];

  const sunlightReading = getEnvironmentReading('sunlight', env);
  const moistureReading = getEnvironmentReading('moisture', env);
  const temperatureReading = getEnvironmentReading('temperature', env);
  const readingText = t.advisor.readings;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top God Tools Bar */}
      <section aria-label={t.hud.environmentSectionLabel} className="glass-panel rounded-2xl p-4 flex flex-col items-stretch gap-4">
        {/* Tool Selectors */}
        <div className="tool-grid grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="group" aria-label={t.hud.toolGroupLabel}>
          <button
            onClick={() => onSelectTool('inspect')}
            aria-pressed={activeTool === 'inspect'}
            className={`tool-button min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'inspect'
                ? 'tool-button-active'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={tools.inspect.buttonTitle}
          >
            <Search className="w-3.5 h-3.5" />
            <span>{tools.inspect.button}</span>
          </button>

          <button
            onClick={() => onSelectTool('feed')}
            aria-pressed={activeTool === 'feed'}
            className={`tool-button min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'feed'
                ? 'tool-button-active'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={tools.feed.buttonTitle}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tools.feed.button}</span>
          </button>

          <button
            onClick={() => onSelectTool('mutagen')}
            aria-pressed={activeTool === 'mutagen'}
            className={`tool-button min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'mutagen'
                ? 'tool-button-active'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={tools.mutagen.buttonTitle}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{tools.mutagen.button}</span>
          </button>

          <button
            onClick={() => onSelectTool('tap')}
            aria-pressed={activeTool === 'tap'}
            className={`tool-button min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'tap'
                ? 'tool-button-active'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={tools.tap.buttonTitle}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>{tools.tap.button}</span>
          </button>
        </div>

        {/* Speed & Audio Controls */}
        <div className="simulation-controls flex flex-wrap items-center justify-between gap-2">
          {/* Day / Night cycle toggle */}
          <button
            onClick={() => onEnvChange({ autoDayNight: !env.autoDayNight })}
            className={`control-button p-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all ${
              env.autoDayNight
                ? 'tool-button-active'
                : 'bg-black/30 text-emerald-50/70 border-white/5 hover:text-emerald-50'
            }`}
            title={t.hud.dayNightTitle}
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.hud.dayNightLabel}</span>
          </button>

          {/* Time Speed Buttons */}
          <div className="speed-controls flex items-center p-1 rounded-xl" role="group" aria-label={t.hud.speedGroupLabel}>
            <button
              onClick={() => onEnvChange({ timeSpeed: env.timeSpeed === 0 ? 1 : 0 })}
              aria-label={env.timeSpeed === 0 ? t.hud.play : t.hud.pause}
              className={`control-button p-1.5 rounded-lg transition-colors ${
              env.timeSpeed === 0 ? 'bg-emerald-500/30 text-emerald-100' : 'text-emerald-50/70 hover:text-emerald-50'
              }`}
              title={t.hud.playPauseTitle}
            >
              {env.timeSpeed === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onEnvChange({ timeSpeed: 1 })}
              className={`control-button px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
              env.timeSpeed === 1 ? 'tool-button-active' : 'text-emerald-50/70 hover:text-emerald-50'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => onEnvChange({ timeSpeed: 2 })}
              className={`control-button px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
              env.timeSpeed === 2 ? 'tool-button-active' : 'text-emerald-50/70 hover:text-emerald-50'
              }`}
            >
              2x
            </button>
            <button
              onClick={() => onEnvChange({ timeSpeed: 5 })}
              className={`control-button px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
              env.timeSpeed === 5 ? 'tool-button-active' : 'text-emerald-50/70 hover:text-emerald-50'
              }`}
            >
              5x
            </button>
          </div>

          {/* Mute Toggle */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? t.hud.unmute : t.hud.mute}
            className={`control-button p-2 rounded-xl border transition-all ${
              isMuted
                ? 'tool-button-active'
                : 'bg-black/30 text-slate-300 border-white/5 hover:text-white'
            }`}
            title={t.hud.muteTitle}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-eco-glow" />}
          </button>
        </div>

        <div
          className="tool-guide rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-3 py-2.5 text-xs text-emerald-50"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-1.5 font-semibold text-emerald-200">
            <MousePointerClick className="h-4 w-4 shrink-0" />
            <span>{toolGuide.guideTitle}</span>
          </div>
          <p className="mt-1.5 leading-relaxed text-emerald-50">{toolGuide.guideDetail}</p>
        </div>

        {activeTool === 'inspect' && (
          <div
            className="hidden rounded-xl border border-emerald-400/20 bg-black/10 px-3 py-2.5 text-xs text-emerald-50 sm:block"
          >
            <div className="flex items-center gap-1.5 font-semibold text-emerald-200">
              <MousePointerClick className="h-4 w-4 shrink-0" />
              <span>{t.hud.microscopeHowToTitle}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-emerald-50 sm:hidden">{t.hud.microscopeHowToCompact}</p>
            <ol className="mt-1.5 hidden sm:grid gap-1 text-xs leading-relaxed text-emerald-50 sm:grid-cols-3">
              {t.hud.microscopeSteps.map((step, index) => (
                <li key={step}>
                  <span className="mr-1 font-mono text-emerald-200">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Environmental Sliders Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {/* 1. Sunlight */}
        <section className="glass-panel env-control rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100 font-medium">
              <Sun className="w-4 h-4 text-emerald-300" />
              <span>{sliders.sunlight.label}</span>
            </div>
            <span className="font-mono text-emerald-200 font-bold">{Math.round(env.sunlight)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={env.sunlight}
            onChange={(e) => onEnvChange({ sunlight: Number(e.target.value) })}
            aria-label={sliders.sunlight.aria}
            className="w-full min-h-[44px]"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{sliders.sunlight.low}</span>
            <span>{sliders.sunlight.mid}</span>
            <span>{sliders.sunlight.high}</span>
          </div>
          <div className={`environment-reaction environment-reaction-${sunlightReading.tone}`}>
            <span aria-hidden="true">↗</span>{readingText[sunlightReading.id].label} · {readingText[sunlightReading.id].detail}
          </div>
        </section>

        {/* 2. Moisture */}
        <section className="glass-panel env-control rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100 font-medium">
              <Droplets className="w-4 h-4 text-emerald-300" />
              <span>{sliders.moisture.label}</span>
            </div>
            <span className="font-mono text-emerald-200 font-bold">{Math.round(env.moisture)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={env.moisture}
            onChange={(e) => onEnvChange({ moisture: Number(e.target.value) })}
            aria-label={sliders.moisture.aria}
            className="w-full min-h-[44px]"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{sliders.moisture.low}</span>
            <span>{sliders.moisture.mid}</span>
            <span>{sliders.moisture.high}</span>
          </div>
          <div className={`environment-reaction environment-reaction-${moistureReading.tone}`}>
            <span aria-hidden="true">↗</span>{readingText[moistureReading.id].label} · {readingText[moistureReading.id].detail}
          </div>
        </section>

        {/* 3. Temperature */}
        <section className="glass-panel env-control rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100 font-medium">
              <Thermometer className="w-4 h-4 text-emerald-300" />
              <span>{sliders.temperature.label}</span>
            </div>
            <span className="font-mono text-emerald-200 font-bold">{Math.round(env.temperature)}°C</span>
          </div>
          <input
            type="range"
            min="-10"
            max="45"
            value={env.temperature}
            onChange={(e) => onEnvChange({ temperature: Number(e.target.value) })}
            aria-label={sliders.temperature.aria}
            className="w-full min-h-[44px]"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{sliders.temperature.low}</span>
            <span>{sliders.temperature.mid}</span>
            <span>{sliders.temperature.high}</span>
          </div>
          <div className={`environment-reaction environment-reaction-${temperatureReading.tone}`}>
            <span aria-hidden="true">↗</span>{readingText[temperatureReading.id].label} · {readingText[temperatureReading.id].detail}
          </div>
        </section>

        {/* 4. Nutrients */}
        <section className="glass-panel env-control rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{sliders.nutrients.label}</span>
            </div>
            <span className="font-mono text-emerald-300 font-bold">{Math.round(env.nutrients)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={env.nutrients}
            onChange={(e) => onEnvChange({ nutrients: Number(e.target.value) })}
            aria-label={sliders.nutrients.aria}
            className="w-full min-h-[44px]"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{sliders.nutrients.low}</span>
            <span>{sliders.nutrients.mid}</span>
            <span>{sliders.nutrients.high}</span>
          </div>
        </section>
      </div>

    </div>
  );
};
