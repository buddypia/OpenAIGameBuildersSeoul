import type { RuleId } from './rules';

export type Vec = { x: number; y: number };

export type RulePair = readonly [RuleId, RuleId];

export type GameSnapshot = {
  active: boolean;
  score: number;
  integrity: number;
  elapsed: number;
  roundRemaining: number;
  pair: RulePair;
  headline: string;
  message: string;
  won: boolean;
};

export type GameInput = {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
};

export type Platform = {
  x: number;
  y: number;
  width: number;
  height: number;
  ttl?: number;
};

export type Orb = Vec & { active: boolean; phase: number };

export type Enemy = Vec & { baseY: number; phase: number; radius: number };
