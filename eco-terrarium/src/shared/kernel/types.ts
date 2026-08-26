// Trophic Levels (먹이사슬 트로픽 레벨)
export type TrophicLevel = 'producer' | 'herbivore' | 'predator' | 'decomposer';

// Organism Behavior State (개체 행동 FSM 상태)
export type OrganismState = 'wandering' | 'foraging' | 'fleeing' | 'mating' | 'resting' | 'dying';

// 10-Dimensional Genetic Genome (10차원 유전자 벡터)
export interface Genome {
  size: number;            // 크기 (0.5 ~ 2.5)
  speed: number;           // 최대 이동 속도 (0.5 ~ 3.0)
  metabolism: number;      // 에너지 소모율 (0.4 ~ 2.0, 낮을수록 효율적)
  tempOpt: number;         // 선호 최적 온도 (-10°C ~ 45°C)
  tempTol: number;         // 온도 허용 범위 오차 (±3°C ~ ±15°C)
  moistOpt: number;        // 선호 최적 수분 (10% ~ 95%)
  hue: number;             // 체색 색상 HSL Hue (0 ~ 360)
  mutationRate: number;    // 돌연변이 발생률 계수 (0.05 ~ 0.5)
  defense: number;         // 방어력 / 껍질 두께 (0.0 ~ 1.0)
  bioluminescence: number; // 생체 발광 밝기 (0.0 ~ 1.0)
}

// Species Definition (생물 종 메타데이터)
export interface SpeciesInfo {
  id: string;
  name: string;             // 한글 이름
  scientificName: string;   // 학명
  trophicLevel: TrophicLevel;
  tier: 1 | 2 | 3 | 4;
  description: string;
  lore: string;
  evolutionHint: string;
  unlocked: boolean;
  baseGenome: Genome;
  spawnConditions: {
    minSun?: number;
    maxSun?: number;
    minMoist?: number;
    maxMoist?: number;
    minTemp?: number;
    maxTemp?: number;
    minNutrients?: number;
    parentSpeciesId?: string;
    specialCondition?: string;
  };
  iconEmoji: string;
  glowColor: string;
}

// Individual Organism Entity (개체 인스턴스)
export interface Organism {
  id: string;
  speciesId: string;
  customName?: string;
  trophicLevel: TrophicLevel;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  energy: number;          // 0 ~ 100
  maxEnergy: number;
  age: number;             // seconds
  lifespan: number;        // seconds
  hunger: number;          // 0 ~ 100 (100 = starving)
  reproductionCooldown: number; // seconds
  generation: number;      // 1, 2, 3...
  state: OrganismState;
  targetX?: number;
  targetY?: number;
  genome: Genome;
  parentIds: string[];
  pulsePhase: number;      // For soft-body wiggling/squash animation
  sizePx: number;
  isDead: boolean;
}

// Food / Nutrient Pellet (유기물 사료/영양제/사체)
export interface FoodPellet {
  id: string;
  type: 'nutrient' | 'mutagen' | 'carcass';
  x: number;
  y: number;
  vx: number;
  vy: number;
  energyValue: number;
  radius: number;
  decayTime: number; // seconds until completely decomposed
}

// Spore / Pollen Particle (생식 포자/꽃가루)
export interface SporeParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speciesId: string;
  genome: Genome;
  color: string;
  lifespan: number;
}

// Environmental State (환경 인자)
export interface EnvironmentState {
  sunlight: number;     // 0 ~ 100 (%)
  moisture: number;     // 0 ~ 100 (%)
  temperature: number;  // -10 ~ 45 (°C)
  nutrients: number;    // 0 ~ 100 (%)
  dayNightCycle: number;// 0 ~ 1 (0 = Midnight, 0.25 = Dawn, 0.5 = Noon, 0.75 = Dusk)
  autoDayNight: boolean;
  timeSpeed: number;    // 0, 0.5, 1, 2, 5
}

// Terrarium Bottle Customization Themes
export type BottleShape = 'classic-jar' | 'geometric-dome' | 'antique-flask' | 'crystal-sphere';
export type SubstrateType = 'moss-forest' | 'deep-sea-sand' | 'volcanic-obsidian' | 'crystal-cave';
export type BackgroundTheme = 'cozy-lab' | 'dawn-mist' | 'sunset-window' | 'cosmic-aurora';

export interface TerrariumCustomization {
  bottleShape: BottleShape;
  substrate: SubstrateType;
  background: BackgroundTheme;
}

// Quest & Achievement System
export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'balance' | 'evolution' | 'environment' | 'sound';
  rewardTitle: string;
  completed: boolean;
  progress: number;
  maxProgress: number;
  check: (state: EcosystemStats, env: EnvironmentState, history: SimHistoryPoint[]) => boolean;
}

// Ecosystem Statistics (생태계 지표)
export interface EcosystemStats {
  totalOrganisms: number;
  producerCount: number;
  herbivoreCount: number;
  predatorCount: number;
  decomposerCount: number;
  unlockedSpeciesCount: number;
  biodiversityIndex: number;  // Shannon-Wiener Biodiversity Index (0 ~ 3.5)
  ecosystemHealth: number;    // 0 ~ 100 (%)
  bioHarmonyScore: number;    // 0 ~ 1000 (Based on stability & musical harmony)
  simulationAgeSeconds: number;
  generationRecord: number;
  extinctionCount: number;
}

export interface SimHistoryPoint {
  time: number;
  producers: number;
  herbivores: number;
  predators: number;
  decomposers: number;
  health: number;
}

// Hive Ecosystem DNA Payload (공유 코드용 데이터 구조)
export interface HiveEcosystemDNA {
  version: string;
  creatorName: string;
  terrariumName: string;
  timestamp: number;
  env: EnvironmentState;
  customization: TerrariumCustomization;
  speciesUnlocked: string[];
  stats: {
    totalAge: number;
    highestScore: number;
    discoveredCount: number;
  };
  /**
   * A complete, bounded population snapshot. Positions are intentionally not
   * persisted: the renderer assigns a safe position for the current viewport
   * when the ecosystem is restored.
   */
  organisms: PersistedOrganism[];
  /** @deprecated Kept only so links created by version 1.0.0 can be loaded. */
  sampleOrganisms?: PersistedOrganism[];
}

export interface PersistedOrganism {
  speciesId: string;
  genome: Genome;
  generation: number;
  customName?: string;
}

// Hive Leaderboard Entry
export interface HiveLeaderboardEntry {
  rank: number;
  playerName: string;
  terrariumName: string;
  score: number;
  discoveredCount: number;
  ageFormatted: string;
  dnaCode: string;
  badge: string;
}
