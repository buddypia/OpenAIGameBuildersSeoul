/**
 * Organic organism motion (유기체 모션)
 *
 * 이 순수 함수들은 캔버스 개체의 촉수·몸통·호흡 움직임에만 사용된다.
 */

/** 값을 [min, max] 범위로 제한한다. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export interface RadialPulseParams {
  /** 각주파수 ω (맥동 속도) */
  frequency: number;
  /** 파수 k (거리에 따른 위상 지연량) */
  waveNumber: number;
  /** 감쇠 계수 λ (끝단으로 갈수록 진폭이 줄어드는 정도) */
  damping: number;
}

/**
 * Pulse(d, t) = sin(ω·t − k·d) · e^(−λ·d)
 *
 * 중심에서 시작한 힘이 끝단으로 갈수록 지연되고 약해지는 연체동물 특유의
 * 움직임을 만든다. 반환값은 [-1, 1] 범위의 정규화된 변위다.
 */
export function radialPulseWave(distance: number, time: number, params: RadialPulseParams): number {
  const d = Math.max(0, distance);
  return Math.sin(time * params.frequency - d * params.waveNumber) * Math.exp(-d * params.damping);
}

export interface SpineWaveSample {
  /** 진행파 위상 φ = ω·t − k·s */
  phase: number;
  /** 양 끝이 0이 되는 진폭 포락선 sin(πs) */
  envelope: number;
  /** 정규화 횡변위 [-1, 1] */
  offset: number;
  /** 스파인 접선에 수직인 법선 벡터 (부속지 방향) */
  normalX: number;
  normalY: number;
}

/**
 * Y(s, t) = A(s)·sin(ω·t − k·s), A(s) = sin(π·s)
 *
 * `progress`는 머리(0)에서 꼬리(1)까지의 정규화 위치다. 마디마다 위상이
 * 조금씩 밀리기 때문에 몸 전체를 타고 흐르는 파동이 생긴다.
 */
export function travelingSpineWave(
  progress: number,
  time: number,
  waveNumber: number,
  speed: number
): SpineWaveSample {
  const s = clamp(progress, 0, 1);
  const phase = time * speed - s * waveNumber;
  const envelope = Math.sin(s * Math.PI);
  return {
    phase,
    envelope,
    offset: Math.sin(phase) * envelope,
    normalX: -Math.sin(phase),
    normalY: Math.cos(phase),
  };
}

/**
 * sin(t + φ)³ — 선형 시간에 가감속을 내장해 기계적이지 않은 호흡 주기를 만든다.
 * 반환값은 [-1, 1].
 */
export function breathingScalar(time: number, phase = 0): number {
  return Math.pow(Math.sin(time + phase), 3);
}
