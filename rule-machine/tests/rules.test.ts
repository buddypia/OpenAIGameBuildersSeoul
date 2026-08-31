import { describe, expect, it } from 'vitest';
import { combinationCount, deriveWorld, nextRulePair, rules } from '../src/rules';

describe('rule machine', () => {
  it('6개의 룰로 15개의 고유 조합을 공개한다', () => {
    expect(combinationCount).toBe(15);
    expect(rules).toHaveLength(6);
  });

  it('같은 룰을 두 번 선택하지 않고 직전 조합도 반복하지 않는다', () => {
    const current = ['gravity-flip', 'enemy-platform'] as const;
    const next = nextRulePair(current, () => 0);
    expect(next[0]).not.toBe(next[1]);
    expect(next).not.toEqual(current);
  });

  it('중력 반전과 적 발판을 게임 물리 규칙으로 변환한다', () => {
    const world = deriveWorld(['gravity-flip', 'enemy-platform']);
    expect(world.gravity).toBe(-1);
    expect(world.enemyPlatforms).toBe(true);
    expect(world.dashBridge).toBe(false);
  });

  it('다리, 벽 통과, 자석, 혜성은 독립된 월드 효과가 된다', () => {
    const world = deriveWorld(['dash-bridge', 'phase-walls']);
    expect(world.dashBridge).toBe(true);
    expect(world.phaseWalls).toBe(true);
    expect(world.magnetOrbs).toBe(false);
    expect(world.cometRain).toBe(false);
  });
});
