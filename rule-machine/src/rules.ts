import type { RulePair } from './game-types';

export const ROUND_SECONDS = 30;

export const rules = [
  {
    id: 'gravity-flip',
    kicker: '↕',
    title: '중력 반전',
    short: '하늘이 바닥이 됩니다',
    color: '#ffbd4a',
  },
  {
    id: 'enemy-platform',
    kicker: '◇',
    title: '적 = 발판',
    short: '위험물이 길이 됩니다',
    color: '#6ee7e0',
  },
  {
    id: 'dash-bridge',
    kicker: '—',
    title: '대시는 다리',
    short: '질주한 자리에 길을 남깁니다',
    color: '#ff6c7a',
  },
  {
    id: 'phase-walls',
    kicker: '↔',
    title: '벽은 문',
    short: '화면 밖에서 반대편으로',
    color: '#a4b6ff',
  },
  {
    id: 'orb-magnet',
    kicker: '◎',
    title: '별이 끌려온다',
    short: '수집 코어가 당신을 찾습니다',
    color: '#9dff9a',
  },
  {
    id: 'comet-rain',
    kicker: '☄',
    title: '혜성 소나기',
    short: '하늘의 오류를 피하세요',
    color: '#e4a7ff',
  },
] as const;

export type RuleId = (typeof rules)[number]['id'];

export type WorldRules = {
  gravity: 1 | -1;
  enemyPlatforms: boolean;
  dashBridge: boolean;
  phaseWalls: boolean;
  magnetOrbs: boolean;
  cometRain: boolean;
};

export const combinationCount = (rules.length * (rules.length - 1)) / 2;

export function getRule(id: RuleId) {
  const rule = rules.find((candidate) => candidate.id === id);
  if (!rule) throw new Error(`Unknown rule: ${id}`);
  return rule;
}

export function deriveWorld(pair: RulePair): WorldRules {
  const active = new Set<RuleId>(pair);
  return {
    gravity: active.has('gravity-flip') ? -1 : 1,
    enemyPlatforms: active.has('enemy-platform'),
    dashBridge: active.has('dash-bridge'),
    phaseWalls: active.has('phase-walls'),
    magnetOrbs: active.has('orb-magnet'),
    cometRain: active.has('comet-rain'),
  };
}

export function nextRulePair(previous: RulePair | null, random = Math.random): RulePair {
  const candidates: RulePair[] = [];
  for (let left = 0; left < rules.length; left += 1) {
    for (let right = left + 1; right < rules.length; right += 1) {
      const pair: RulePair = [rules[left].id, rules[right].id];
      if (!previous || pair[0] !== previous[0] || pair[1] !== previous[1]) candidates.push(pair);
    }
  }
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
}

export function pairTitle(pair: RulePair) {
  return `${getRule(pair[0]).title} × ${getRule(pair[1]).title}`;
}
