import type { Quest } from '../../../shared/kernel/types';
import type { Locale } from './locale';

/** The player-visible half of `Quest`. The `check` predicate stays language-free. */
export interface QuestText {
  title: string;
  description: string;
  rewardTitle: string;
}

/**
 * Translation overlay for the quest board, mirroring `speciesText.ts`:
 * `questData.ts` owns the Korean copy and the completion rules, and a locale
 * only lists the strings it replaces.
 */
type QuestOverlay = Record<string, QuestText>;

const ja: QuestOverlay = {
  quest_first_steps: {
    title: 'いのちの始まり (Genesis)',
    description: 'テラリウムのシミュレーションを20秒以上、安定して継続しましょう。',
    rewardTitle: '神秘の紫ガラス瓶スキンを解放',
  },
  quest_trio_balance: {
    title: '三銃士のバランス (Trophic Trio)',
    description: '生産者・一次消費者・分解者が、それぞれ3匹以上同時に生存する状態を保ちましょう。',
    rewardTitle: 'ダイヤモンド・ジオメトリックドームを解放',
  },
  quest_apex_predator: {
    title: '最上位捕食者の君臨 (Apex Dominance)',
    description: '捕食者を含む4階層の栄養段階がすべて共存する生態系を完成させましょう。',
    rewardTitle: '深海サンゴ砂の底材を解放',
  },
  quest_solar_evolution: {
    title: '太陽の祝福 (Solar Blessing)',
    description: '日照量を80%以上に上げて、新しい植物の変種(ソーラーブルーム)を誕生させましょう。',
    rewardTitle: '夕陽の窓辺の背景テーマを解放',
  },
  quest_ice_age: {
    title: '氷河期の生存者 (Ice Age Survivor)',
    description: '温度を5°C以下まで下げて、低温耐性種(クリスタルリーフ)を適応させましょう。',
    rewardTitle: '水晶洞窟の底材を解放',
  },
  quest_mutagen_catalyst: {
    title: '遺伝の突然変異を促進 (Mutagen Burst)',
    description: '突然変異触媒を注入して、3世代以上の子孫を繁殖させましょう。',
    rewardTitle: '特殊エーテルスポアの胞子を解放',
  },
  quest_biodiversity_master: {
    title: '多様性のオアシス (Biodiversity Oasis)',
    description: '生物多様性のシャノン指数(Shannon Index)1.5以上を達成しましょう。',
    rewardTitle: '夜明けの霧の森の背景を解放',
  },
  quest_night_whisper: {
    title: '夜の生物発光 (Bioluminescent Night)',
    description: '夜の時間帯に、生物発光を放つ生物を15匹以上観察しましょう。',
    rewardTitle: 'オーロラの宇宙の背景テーマを解放',
  },
  quest_harmony_maestro: {
    title: '生態系の指揮者 (Ecosystem Maestro)',
    description: 'バイオハーモニー指数(Harmony Score)750点以上を達成し、和音のシンフォニーを響かせましょう。',
    rewardTitle: '魔法の水晶球ドームスキンを解放',
  },
  quest_encyclopedia_collector: {
    title: '偉大な生物学者 (Grand Naturalist)',
    description: '生物図鑑で8種以上の新種を解放しましょう。',
    rewardTitle: '伝説のコスミックプランクトン誘引試薬を解放',
  },
};

const en: QuestOverlay = {
  quest_first_steps: {
    title: 'Genesis',
    description: 'Keep the terrarium simulation running steadily for at least 20 seconds.',
    rewardTitle: 'Unlocks the mystic violet jar skin',
  },
  quest_trio_balance: {
    title: 'Trophic Trio',
    description: 'Keep producers, primary consumers and decomposers all alive at three or more each, at the same time.',
    rewardTitle: 'Unlocks the diamond geometric dome',
  },
  quest_apex_predator: {
    title: 'Apex Dominance',
    description: 'Complete an ecosystem where all four trophic levels coexist, predators included.',
    rewardTitle: 'Unlocks the deep-sea coral sand substrate',
  },
  quest_solar_evolution: {
    title: 'Solar Blessing',
    description: 'Raise sunlight above 80% to give birth to a new plant variant (Solar Bloom).',
    rewardTitle: 'Unlocks the sunset window background',
  },
  quest_ice_age: {
    title: 'Ice Age Survivor',
    description: 'Drop the temperature to 5°C or below so a cold-tolerant species (Crystal Leaf) can adapt.',
    rewardTitle: 'Unlocks the crystal cave substrate',
  },
  quest_mutagen_catalyst: {
    title: 'Mutagen Burst',
    description: 'Inject a mutagen and breed offspring through at least three generations.',
    rewardTitle: 'Unlocks the special Aether Spore',
  },
  quest_biodiversity_master: {
    title: 'Biodiversity Oasis',
    description: 'Reach a Shannon biodiversity index of 1.5 or higher.',
    rewardTitle: 'Unlocks the dawn mist forest background',
  },
  quest_night_whisper: {
    title: 'Bioluminescent Night',
    description: 'Observe 15 or more bioluminescent organisms during the night phase.',
    rewardTitle: 'Unlocks the cosmic aurora background',
  },
  quest_harmony_maestro: {
    title: 'Ecosystem Maestro',
    description: 'Reach a Bio Harmony score of 750 or higher and let the full chord symphony ring out.',
    rewardTitle: 'Unlocks the magic crystal sphere skin',
  },
  quest_encyclopedia_collector: {
    title: 'Grand Naturalist',
    description: 'Unlock at least eight species in the codex.',
    rewardTitle: 'Unlocks the legendary Cosmic Plankton lure reagent',
  },
};

const OVERLAYS: Partial<Record<Locale, QuestOverlay>> = { en, ja };

export function getQuestText(quest: Quest, locale: Locale): QuestText {
  const overlay = OVERLAYS[locale]?.[quest.id];
  if (overlay) return overlay;
  return {
    title: quest.title,
    description: quest.description,
    rewardTitle: quest.rewardTitle,
  };
}
