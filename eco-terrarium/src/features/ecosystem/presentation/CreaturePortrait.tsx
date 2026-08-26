import React, { useEffect, useRef } from 'react';
import { SpeciesInfo } from '../../../shared/kernel/types';
import { useI18n } from '../../i18n';
import { TerrariumRenderer } from './terrariumRenderer';

const portraitRenderer = new TerrariumRenderer();

interface Props {
  species: SpeciesInfo;
  size?: number;
  animate?: boolean;
  className?: string;
}

export const CreaturePortrait: React.FC<Props> = ({
  species,
  size = 64,
  animate = true,
  className,
}) => {
  const { speciesText } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const start = performance.now();
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      portraitRenderer.renderSpeciesPortrait(
        ctx,
        size,
        species,
        (performance.now() - start) / 1000
      );
      if (animate) raf = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(raf);
  }, [species, size, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={className}
      role="img"
      aria-label={speciesText(species).name}
    />
  );
};
