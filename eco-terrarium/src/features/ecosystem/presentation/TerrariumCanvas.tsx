import React, { useRef, useEffect, useCallback } from 'react';
import { FlaskConical, Hand, Search, Sprout } from 'lucide-react';
import { EcosystemEngine } from '../domain/ecosystemEngine';
import { TerrariumRenderer } from './terrariumRenderer';
import { EnvironmentState, TerrariumCustomization, SpeciesInfo, Organism } from '../../../shared/kernel/types';
import { useI18n } from '../../i18n';
import { ActiveTool } from './EnvironmentHUD';

interface Props {
  engine: EcosystemEngine;
  renderer: TerrariumRenderer;
  env: EnvironmentState;
  customization: TerrariumCustomization;
  speciesMap: Map<string, SpeciesInfo>;
  activeTool: ActiveTool;
  selectedOrganism: Organism | null;
  ecosystemHealth: number;
  onSelectOrganism: (org: Organism | null) => void;
  onCanvasClickFeedback?: () => void;
  isSimulationActive: boolean;
}

export const TerrariumCanvas: React.FC<Props> = ({
  engine,
  renderer,
  env,
  customization,
  speciesMap,
  activeTool,
  selectedOrganism,
  ecosystemHealth,
  onSelectOrganism,
  onCanvasClickFeedback,
  isSimulationActive,
}) => {
  const { t } = useI18n();
  const cursorClassByTool: Record<ActiveTool, string> = {
    inspect: 'cursor-inspect',
    feed: 'cursor-feed',
    mutagen: 'cursor-mutagen',
    tap: 'cursor-tap',
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const hoveredOrgIdRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);
  // requestAnimationFrame is installed once. Keep every value it needs in a ref so
  // it never captures the pre-start `false` value and silently stops the engine.
  const latestRenderStateRef = useRef({
    env,
    customization,
    speciesMap,
    selectedOrganism,
    ecosystemHealth,
    isSimulationActive,
  });

  useEffect(() => {
    latestRenderStateRef.current = {
      env,
      customization,
      speciesMap,
      selectedOrganism,
      ecosystemHealth,
      isSimulationActive,
    };
  }, [env, customization, speciesMap, selectedOrganism, ecosystemHealth, isSimulationActive]);

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    if (width <= 0 || height <= 0) return;

    // 장면이 전부 부드러운 그라디언트라 픽셀을 더 채워도 선명도 이득이 거의 없다.
    // 레티나에서 백버퍼가 300만 픽셀을 넘어가면 래스터 비용만 그만큼 커진다.
    const maxPixels = 2_400_000;
    const requested = Math.min(window.devicePixelRatio || 1, 2);
    const pixelRatio = Math.min(requested, Math.sqrt(maxPixels / (width * height)));
    const nextWidth = Math.floor(width * pixelRatio);
    const nextHeight = Math.floor(height * pixelRatio);

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      contextRef.current = canvas.getContext('2d');
      contextRef.current?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      engine.resizeBounds(
        width,
        height,
        Math.max(50, width * 0.08),
        Math.max(40, height * 0.08)
      );
    }
  }, [engine]);

  useEffect(() => {
    handleResize();
    // 레이아웃 변화(패널 접기, 모바일 주소창)도 잡되 한 프레임에 한 번만 반영한다.
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        handleResize();
      });
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    if (containerRef.current) observer?.observe(containerRef.current);
    window.addEventListener('resize', schedule);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [handleResize]);

  // Main Animation Loop
  useEffect(() => {
    const loop = (now: number) => {
      // 다음 프레임을 먼저 예약한다. 예전에는 마지막 줄에서 예약했기 때문에
      // 렌더 중 예외가 한 번이라도 나면 테라리움이 영구히 멈춰 버렸다.
      animFrameIdRef.current = requestAnimationFrame(loop);

      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // Update simulation physics & biology
      const renderState = latestRenderStateRef.current;
      if (renderState.isSimulationActive) {
        engine.update(dt, renderState.env);
      }

      // Render frame
      const canvas = canvasRef.current;
      const ctx = contextRef.current ?? (contextRef.current = canvas?.getContext('2d') ?? null);
      if (canvas && ctx) {
        renderer.render({
          canvas,
          ctx,
          organisms: engine.organisms,
          foodPellets: engine.foodPellets,
          spores: engine.spores,
          shockwaves: engine.shockwaves,
          consumptionEffects: engine.consumptionEffects,
          env: renderState.env,
          customization: renderState.customization,
          speciesMap: renderState.speciesMap,
          selectedOrganismId: renderState.selectedOrganism?.id || null,
          hoveredOrganismId: hoveredOrgIdRef.current,
          ecosystemHealth: renderState.ecosystemHealth,
          time: now / 1000,
        });
      }
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [engine, renderer]);

  // Mouse / Touch Event Handlers
  const handleInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    onCanvasClickFeedback?.();

    if (activeTool === 'tap') {
      engine.tapGlass(x, y);
    } else if (activeTool === 'feed') {
      engine.addFoodPellet('nutrient', x, y, 35);
    } else if (activeTool === 'mutagen') {
      engine.addFoodPellet('mutagen', x, y, 50);
    } else if (activeTool === 'inspect') {
      // Find closest organism within clicking threshold
      let closest: Organism | null = null;
      let minDistance = 35;

      for (const org of engine.organisms) {
        const dist = Math.hypot(org.x - x, org.y - y);
        if (dist < minDistance + org.sizePx) {
          minDistance = dist;
          closest = org;
        }
      }

      onSelectOrganism(closest);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'inspect') {
      hoveredOrgIdRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found: string | null = null;
    for (const org of engine.organisms) {
      const dist = Math.hypot(org.x - x, org.y - y);
      if (dist < org.sizePx + 20) {
        found = org.id;
        break;
      }
    }
    hoveredOrgIdRef.current = found;
  };

  const handleKeyboardInteraction = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (activeTool === 'inspect' && engine.organisms[0]) {
      const organism = engine.organisms[0];
      handleInteraction(rect.left + organism.x, rect.top + organism.y);
      return;
    }
    handleInteraction(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  return (
    <div
      ref={containerRef}
      className="terrarium-stage relative w-full h-full min-h-[420px] overflow-hidden select-none cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onClick={(e) => handleInteraction(e.clientX, e.clientY)}
        onKeyDown={handleKeyboardInteraction}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        aria-label={activeTool === 'inspect' ? t.canvas.inspectAria : t.canvas.defaultAria}
        aria-keyshortcuts="Enter Space"
        role="button"
        tabIndex={0}
        className={`w-full h-full block ${cursorClassByTool[activeTool]}`}
      />

      {/* Floating Tool Cursor Hint Overlay */}
      <div className="stage-instruction absolute top-3 left-3 right-3 sm:right-auto pointer-events-none px-3 py-2 text-[11px] leading-relaxed flex items-center gap-2">
        {activeTool === 'inspect' ? <Search className="w-3.5 h-3.5" /> : activeTool === 'feed' ? <Sprout className="w-3.5 h-3.5" /> : activeTool === 'mutagen' ? <FlaskConical className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
        <span>{t.canvas.hints[activeTool]}</span>
      </div>
    </div>
  );
};
