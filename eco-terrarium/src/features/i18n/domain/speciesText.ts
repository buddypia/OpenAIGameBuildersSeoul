import type { SpeciesInfo } from '../../../shared/kernel/types';
import type { Locale } from './locale';

/** The player-visible half of `SpeciesInfo`. Everything else is simulation data. */
export interface SpeciesText {
  name: string;
  description: string;
  lore: string;
  evolutionHint: string;
}

/**
 * Translation overlay for the species database.
 *
 * `speciesData.ts` stays the single source of truth for both the numbers and
 * the Korean copy; a locale only lists what it overrides, keyed by species id.
 * A species missing from an overlay falls back to its authored Korean text, so
 * adding a species can never crash a non-Korean session.
 */
type SpeciesOverlay = Record<string, SpeciesText>;

const ja: SpeciesOverlay = {
  lumi_flora: {
    name: 'ルミフローラ',
    description:
      '小さな光をたたえてゆっくり漂う、基本の植物プランクトン。生態系の土台となる栄養を担います。',
    lore: 'ガラス瓶の底や水中でやわらかな若草色の光を放ち、光と水分から酸素をつくり出します。',
    evolutionHint: '基本生物 (最初から解放)',
  },
  solar_bloom: {
    name: 'ソーラーブルーム',
    description: '強い陽射しを吸収して黄金の花びらを広げる、巨大な光合成植物。',
    lore: '日照量80%以上の温かい環境で繁栄し、周囲の微生物に豊かな活力エネルギーを放ちます。',
    evolutionHint: '日照量80%以上 & 温度25°C以上を維持するとルミフローラから進化',
  },
  aqua_kelp: {
    name: 'アクアケルプ',
    description: '湿度の高い環境でリズミカルに踊る、水生の海藻型微生物のコロニー。',
    lore: 'ガラス瓶の中が水分で満たされると胞子を一気に撒き散らし、水中の有害物質を吸収します。',
    evolutionHint: '水分80%以上を維持するとルミフローラから進化',
  },
  crystal_leaf: {
    name: 'クリスタルリーフ',
    description: '氷点下の極限環境でのみ結晶化して育つ、青い氷晶の植物。',
    lore: '冷たいガラス壁の表面に幾何学的な雪の結晶をつくり、低温でも凍らない不凍液の樹液を分泌します。',
    evolutionHint: '温度5°C以下 (氷河期) を維持すると突然変異で誕生',
  },
  jelly_wiggle: {
    name: 'ゼリーウィグル',
    description: '半透明のピンク色の体でぽよぽよ跳ねながら植物プランクトンを食べる、かわいい草食生物。',
    lore: '猫のゼリーのようにやわらかく、お腹がいっぱいになると小さな喜びの泡を吐き出します。',
    evolutionHint: '基本の一次消費者 (最初から解放)',
  },
  glow_tail: {
    name: 'グロウテイル',
    description: '尾の先で星屑の粒をきらめかせながら素早く泳ぐ、俊敏な草食生物。',
    lore: '捕食者の気配を感じ取ると、一瞬だけ尾の光を明滅させて相手を惑わせ逃げ去ります。',
    evolutionHint: '速度の遺伝値1.6以上 & 水分70%以上でゼリーウィグルから分化',
  },
  shell_pod: {
    name: 'シェルポッド',
    description: '硬く透明な殻をもつ緩歩動物型の生物。捕食者の攻撃を完璧に防ぎます。',
    lore: '遅いけれど粘り強い生命力をもち、ガラス瓶の環境が悪化しても最も長く生き延びます。',
    evolutionHint: '防御力の遺伝値0.5以上 & 栄養塩類60%以上で進化',
  },
  aurora_fin: {
    name: 'オーロラフィン',
    description: '光の角度によって虹色に変わるオーロラの鰭をひるがえす幻想種。',
    lore: 'オーロラフィンが通り過ぎた跡には穏やかな癒しの波動が残り、周囲の生物の体力を回復させます。',
    evolutionHint: '突然変異触媒(Mutagen)の摂取 & 温度30°C以上で希少変異',
  },
  phantom_lip: {
    name: 'ファントムリップ',
    description: '紫の半透明の体で草食生物をやさしく包み込んで食べる、優雅な捕食者。',
    lore: '過剰になった草食生物の個体数を調整し、植物の絶滅を防ぐ守護者の役割を担います。',
    evolutionHint: '基本の捕食者 (最初から解放)',
  },
  spike_hunter: {
    name: 'スパイクハンター',
    description: '黄金の角と棘で武装し、稲妻のように前方へ突進する猛烈なハンター。',
    lore: '素早い獲物を狩るために進化し、狩りに成功すると勝利の閃光パルスを放ちます。',
    evolutionHint: '草食生物の個体数が15匹以上に繁栄するとファントムリップから分化',
  },
  nebula_kraken: {
    name: 'ネビュラクラーケン',
    description: '宇宙の星雲のように神秘的な触手と星の光を放つ、伝説の最上位ミニクラーケン。',
    lore: 'すべての生態系バランス指数が85%以上を60秒間保ったとき、次元の裂け目から生まれます。',
    evolutionHint: '生態系の健全度85%以上 & 4階層の栄養段階が共存すると伝説が誕生',
  },
  mycel_linker: {
    name: 'マイセルリンカー',
    description: '底の土にキノコ型の菌糸を伸ばし、死骸と老廃物を有機栄養塩へ還す分解者。',
    lore: '生命の終わりを新しい始まりへつなぐ、生態系循環の要となる環です。',
    evolutionHint: '基本の分解者 (最初から解放)',
  },
  bio_purifier: {
    name: 'バイオピュリファイア',
    description: '有毒ガスと老廃物を吸収し、澄んだ酸素の浄化泡をぽこぽこ弾けさせるヒーリング球体。',
    lore: 'テラリウム内部の水質を常に清らかに保ち、すべての生物の寿命を延ばします。',
    evolutionHint: '水分75%以上 & 水中の老廃物を浄化すると進化',
  },
  aether_spore: {
    name: 'エーテルスポア',
    description: '死んだ生物の魂のエネルギーを集め、幻想的な青緑の進化胞子を撒く神秘の菌類。',
    lore: 'この胞子を吸収した微生物は、次の世代で非常に希少な突然変異形質を得ます。',
    evolutionHint: '累積の死滅個体を20匹以上分解すると希少覚醒',
  },
  cosmic_plankton: {
    name: 'コスミックプランクトン',
    description: '夜空のオーロラと天の川のエネルギーを集めて星の光を放つ、究極の発光生物。',
    lore: '昼と夜の循環が5回以上過ぎ、図鑑が60%以上解放されたとき、ふいに姿を現します。',
    evolutionHint: '夜の時間帯(Night) & 高い生物多様性を達成すると神秘的に出現',
  },
  prism_amoeba: {
    name: 'プリズムアメーバ',
    description: '周囲の環境の色と温度に応じて、体色と屈折率をリアルタイムに変異させるカメレオンアメーバ。',
    lore: '環境が劇的に変わってもしなやかに姿を変え、どんな気候でも繁栄できます。',
    evolutionHint: '急激な温度変化(-10°C <-> 40°C)を耐え抜いた個体から発現',
  },
};

const en: SpeciesOverlay = {
  lumi_flora: {
    name: 'Lumi Flora',
    description:
      'A basic phytoplankton that drifts slowly, holding a faint light. It carries the ecosystem\u2019s foundational nutrition.',
    lore: 'It gives off a soft yellow-green glow along the jar floor and through the water, producing oxygen from light and moisture.',
    evolutionHint: 'Starter species (unlocked from the beginning)',
  },
  solar_bloom: {
    name: 'Solar Bloom',
    description: 'A giant photosynthetic plant that absorbs fierce sunlight and unfurls golden petals.',
    lore: 'It thrives in warm environments above 80% sunlight, releasing rich vitality energy to the microbes around it.',
    evolutionHint: 'Evolves from Lumi Flora at 80%+ sunlight and 25°C+',
  },
  aqua_kelp: {
    name: 'Aqua Kelp',
    description: 'A colony of aquatic, kelp-like microbes that dance rhythmically in humid conditions.',
    lore: 'When the jar fills with moisture it scatters spores rapidly and absorbs harmful substances from the water.',
    evolutionHint: 'Evolves from Lumi Flora when moisture stays above 80%',
  },
  crystal_leaf: {
    name: 'Crystal Leaf',
    description: 'A blue ice-crystal plant that only crystallizes and grows in sub-zero extremes.',
    lore: 'It forms geometric snowflakes on the cold glass and secretes an antifreeze sap that will not freeze at low temperatures.',
    evolutionHint: 'A mutation born when the temperature is held at or below 5°C (ice age)',
  },
  jelly_wiggle: {
    name: 'Jelly Wiggle',
    description: 'An adorable herbivore with a translucent pink body that bounces along, grazing on phytoplankton.',
    lore: 'Soft and squishy like cat jelly; when it is full it puffs out little bubbles of delight.',
    evolutionHint: 'Starter primary consumer (unlocked from the beginning)',
  },
  glow_tail: {
    name: 'Glow Tail',
    description: 'A nimble herbivore that swims fast, sparkling stardust particles from the tip of its tail.',
    lore: 'When it senses a predator it flashes its tail light for an instant to confuse them, then flees.',
    evolutionHint: 'Splits from Jelly Wiggle at speed gene 1.6+ and moisture 70%+',
  },
  shell_pod: {
    name: 'Shell Pod',
    description: 'A tardigrade-like organism with a hard, transparent shell. It blocks predator attacks completely.',
    lore: 'Slow but tenacious, it survives longest of all when conditions in the jar deteriorate.',
    evolutionHint: 'Evolves at defense gene 0.5+ and nutrients 60%+',
  },
  aurora_fin: {
    name: 'Aurora Fin',
    description: 'A fantastical species that flutters aurora fins shifting through rainbow colors with the angle of light.',
    lore: 'A gentle healing wave lingers wherever an Aurora Fin has passed, restoring the vitality of nearby organisms.',
    evolutionHint: 'Rare mutation after mutagen intake at 30°C+',
  },
  phantom_lip: {
    name: 'Phantom Lip',
    description: 'An elegant predator with a translucent violet body that gently envelops herbivores to consume them.',
    lore: 'It acts as a guardian, regulating runaway herbivore populations and preventing plant extinction.',
    evolutionHint: 'Starter predator (unlocked from the beginning)',
  },
  spike_hunter: {
    name: 'Spike Hunter',
    description: 'A ferocious hunter armed with golden horns and spines, charging forward like lightning.',
    lore: 'It evolved to hunt fast prey, and releases a flash pulse of victory on a successful kill.',
    evolutionHint: 'Splits from Phantom Lip once herbivores reach 15+ individuals',
  },
  nebula_kraken: {
    name: 'Nebula Kraken',
    description: 'A legendary apex mini-kraken radiating starlight and tentacles as mysterious as a cosmic nebula.',
    lore: 'It is born from a rift in dimensions when every ecosystem balance index holds above 85% for 60 seconds.',
    evolutionHint: 'A legend born at 85%+ ecosystem health with all four trophic levels coexisting',
  },
  mycel_linker: {
    name: 'Mycel Linker',
    description: 'A decomposer that spreads mushroom-shaped mycelium through the substrate, returning carcasses and waste to organic nutrients.',
    lore: 'The key link in the ecosystem\u2019s cycle, connecting the end of one life to the start of another.',
    evolutionHint: 'Starter decomposer (unlocked from the beginning)',
  },
  bio_purifier: {
    name: 'Bio Purifier',
    description: 'A healing orb that absorbs toxic gas and waste, popping clear bubbles of purified oxygen.',
    lore: 'It keeps the water inside the terrarium pristine at all times, extending the lifespan of every organism.',
    evolutionHint: 'Evolves at moisture 75%+ while purifying waterborne waste',
  },
  aether_spore: {
    name: 'Aether Spore',
    description: 'A mysterious fungus that gathers the soul energy of the dead and scatters ethereal teal evolution spores.',
    lore: 'A microbe that absorbs these spores gains an exceedingly rare mutation in the next generation.',
    evolutionHint: 'A rare awakening after decomposing 20+ cumulative deaths',
  },
  cosmic_plankton: {
    name: 'Cosmic Plankton',
    description: 'The ultimate luminescent organism, gathering the energy of the night aurora and the Milky Way to radiate starlight.',
    lore: 'It appears out of nowhere once five day-night cycles have passed and the codex is 60% unlocked.',
    evolutionHint: 'Appears mysteriously at night with high biodiversity',
  },
  prism_amoeba: {
    name: 'Prism Amoeba',
    description: 'A chameleon amoeba that mutates its body color and refractive index in real time with the surrounding color and temperature.',
    lore: 'It reshapes itself fluidly even through dramatic environmental swings, thriving in any climate.',
    evolutionHint: 'Expressed in individuals that survive a sharp temperature swing (-10°C <-> 40°C)',
  },
};

const OVERLAYS: Partial<Record<Locale, SpeciesOverlay>> = { en, ja };

/**
 * Player-visible text for one species in the given locale.
 * Never copies the species object, so `unlocked` stays live for the caller.
 */
export function getSpeciesText(species: SpeciesInfo, locale: Locale): SpeciesText {
  const overlay = OVERLAYS[locale]?.[species.id];
  if (overlay) return overlay;
  return {
    name: species.name,
    description: species.description,
    lore: species.lore,
    evolutionHint: species.evolutionHint,
  };
}
