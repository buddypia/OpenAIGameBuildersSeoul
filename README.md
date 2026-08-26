# 🌿 Eco Terrarium: Micro Evolution

> *Conduct a living ecosystem inside a glass jar. Tune light, moisture, temperature and nutrients — then watch 16 species evolve, hunt, decompose and sing.*

**OpenAI Game Builders Seoul — Hackathon Submission**

A healing sandbox simulation built on a real 4-trophic Lotka–Volterra differential model, Boids flocking, a 10-dimensional genome with environment-directed mutation, and a fully procedural Web Audio soundtrack. No audio files, no API keys, no network calls — everything is synthesized in code and runs offline in the browser.

**[English](#english) · [日本語](#日本語)**

---

<a name="english"></a>

# English

## 1. Requirements

| Item | Version | Notes |
| :--- | :--- | :--- |
| Node.js | 20 or later | Verified on `v22.22.1` |
| pnpm | 9 or later | Verified on `11.23.0`. npm 10+ also works |
| Browser | Chrome / Safari / Edge / Firefox (latest) | Mobile iOS / Android web supported |

No API key, no `.env`, no backend. The game is 100% client-side and offline.

## 2. Quick Start

```bash
cd eco-terrarium
pnpm install
pnpm dev
```

Open **http://localhost:3000**. If the port is taken, Vite automatically falls back to the next free port (`strictPort: false`) — check the terminal output for the actual URL.

Click anywhere once to start audio. Browsers block `AudioContext` until the first user gesture; the game resumes it gracefully on your first tap.

### Other commands

```bash
pnpm test       # Vitest unit tests — 55 tests across 8 files
pnpm build      # tsc + production bundle into dist/
pnpm preview    # Serve the production build on port 3000
```

> **Note:** there is no root-level `package.json`. Always run commands from inside `eco-terrarium/`.

## 3. How to Play

You are not a character — you are the hand above the jar. You never command creatures directly; you change their world and let the math do the rest.

### 3.1 The four environmental dials

| Dial | Control | What it drives | Sweet spot & extremes |
| :--- | :--- | :--- | :--- |
| ☀️ **Sunlight** | Top slider / focused light click | Photosynthesis rate of producers, slight heating | **40–70%** balanced · >90% algal bloom & bleaching · <10% plants wither |
| 💧 **Moisture** | Rain slider / tap the raincloud | Fluid drag, decomposer activity, aquatic breeding | **50–80%** optimal · <20% drought · >95% drowning |
| 🌡️ **Temperature** | Heater / cooler toggle, −10 °C to 45 °C | Metabolic rate, stamina drain, **mutation pressure** | **18–26 °C** temperate · <0 °C ice age (crystallization) · >38 °C tropical (mutation accelerates) |
| 🧪 **Nutrients** | Drop organic feed / inject Mutagen | Microbial feeding, floor moss nutrient density | Moderate accelerates growth · excess causes pollution and anaerobic blooms |

Extra interactions: **knock the glass** to send a shockwave through the swarm, **drop feed** to bait herbivores into a cluster, and **inject Mutagen** to spike the mutation rate for a few seconds.

### 3.2 The loop

```
Observe  →  Adjust environment  →  Simulation solves (Lotka–Volterra + Boids)
   ↑                                            ↓
Hive share  ←  Quest rewards  ←  Speciation & codex unlock (music grows richer)
```

Every new species you unlock adds a voice to the score. A thriving, balanced jar literally sounds fuller than a dying one — the harmony index drives the chord palette.

### 3.3 Inspector

Click any organism to open the microscope inspector: all 10 gene values, live close-up view, lineage tree, and a rename field. Custom names are carried into the autosave and into DNA share codes.

### 3.4 Judge Quick Showcase

Four one-click presets for demos and reviewers:

| Preset | What it shows |
| :--- | :--- |
| ⚡ **Instant Prosperity** | A perfectly balanced, fully bloomed 4-tier jar, loaded instantly |
| 🔥 **Mutation Rush** | Nutrient + heat catalyst — a new species evolves within ~5 seconds |
| ❄️ **Ice Age Escape** | −5 °C survival drama with Crystal Leaf and cold-adapted life |
| 🎵 **Symphony** | All bio-harmony layers at once, full orchestration audio test |

## 4. Species & Evolution

16 species across 4 trophic tiers form a closed material cycle: producers feed herbivores, herbivores feed predators, predators' corpses feed decomposers, and decomposers return nutrients to producers.

```
🌿 Producers          🫧 Herbivores         👁️ Predators          🍄 Decomposers
─────────────         ─────────────         ─────────────         ─────────────
Lumi Flora            Jelly Wiggle          Phantom Lip           Mycel Linker
  ├ Solar Bloom         ├ Glow Tail           ├ Spike Hunter        ├ Bio Purifier
  │  (sun > 80%)        │  (speed gene)       │  (aggression gene)  │  (oxygen spec.)
  ├ Aqua Kelp           ├ Shell Pod           └ Nebula Kraken       └ Aether Spore
  │  (moisture > 85%)   │  (defense gene)        (4 tiers coexist      (rare mutation)
  └ Crystal Leaf        └ Aurora Fin             for 120s)
     (temp < 5 °C)         (temp > 35 °C
                            + catalyst)

     └──── feeds ────→ └──── feeds ────→ └──── corpses ────→ └──── nutrients ────┐
     ↑                                                                            │
     └────────────────────────────────────────────────────────────────────────────┘
```

Two more appear only under special conditions: **Cosmic Plankton** (all four tiers in perfect harmony) and **Prism Amoeba** (color shifts in real time with ambient light).

Highlights: **Nebula Kraken** is the legendary guardian — a galaxy-patterned mini kraken that only appears after all four trophic levels coexist for 120 seconds. **Aether Spore** scatters cyan spores that accelerate the next generation's evolution. **Shell Pod** blocks exactly one predator attack with its translucent shell.

## 5. Under the Hood

### 5.1 Simulation

Extended Lotka–Volterra system over nutrients `N`, producers `P`, herbivores `C`, predators `H` and decomposers `D`, integrated with **4th-order Runge–Kutta**:

```
dN/dt = κ·D − α_N·P·N + Input_nutrient
dP/dt = r(S,M,T)·P·(1 − P/K(N)) − β·P·C
dC/dt = ε_C·β·P·C − γ·C·H − μ_C(T)·C
dH/dt = ε_H·γ·C·H − μ_H(T)·H
dD/dt = δ·Corpses − μ_D·D
```

The growth term is a Gaussian optimum curve over the environment:

```
r(S,M,T) = r_max · (S/100) · (M/100) · exp( −(T − T_opt)² / 2σ_T² )
```

On top of the population-level ODEs, every individual is simulated separately with a finite state machine (wander / forage / mate / flee / decompose) and **Boids** cohesion–separation–alignment steering under fluid viscosity.

### 5.2 Genetics

Each individual carries a 10-dimensional genome:

```
g = [ size, speed, metabolism, tempOpt, tempTol, moistOpt,
      hue, mutationRate, defense, bioluminescence ]
```

Offspring inherit `g_child = g_parent + N(0, σ²) + P_env`, where `P_env` is an **environmental pressure vector**. Run the jar hot and genomes drift toward heat tolerance across generations on their own — speciation is emergent, not scripted.

### 5.3 Procedural audio

Zero audio assets. Everything is synthesized live through the Web Audio API in three layers:

- **Ambient pad** — dual oscillator (sine + triangle) with an LFO filter sweep
- **Bio-chimes** — ADSR glockenspiel pings triggered by eating, splitting and evolving
- **Nature foley** — rain as band-pass-filtered pink noise, sunlight as high shimmer harmonics, glass tap as a 2200 Hz damped bell

The harmonic palette starts on C major / A pentatonic and grows 9th and 11th tensions, shifting toward Lydian as the ecosystem harmony index rises.

### 5.4 Sharing

The full jar state — environment values, population counts, representative gene pool, custom skin IDs — is JSON-serialized, LZ-compressed via `lz-string`, and emitted as both a URL deep link (`?dna=...`, with `?code=...` accepted as an alias) and a short code in `ECO-XXXX-XX` form. Opening the link rebuilds someone else's ecosystem exactly.

> The visitor mode, pollen gifting and global leaderboard are implemented as a **local Hive-style demo layer with mock ranking data**. The design is Com2uS Hive-ready, but no live Hive SDK is wired up in this build.

### 5.5 Accessibility

`prefers-reduced-motion` is honored across all animations, and live ecosystem status is announced through `aria-live` regions. Audio never autoplays before a user gesture.

### 5.6 Autosave

Once you enter the game, the terrarium and your quest progress are written to `localStorage` every 10 seconds and again whenever the tab is hidden or closed. Reopening the page restores exactly where you left off.

A shared deep link always wins over the local save, so visiting someone else's `?dna=` link shows their jar rather than silently loading your own. If storage is unavailable — Safari private mode, quota exceeded — the save fails silently and play continues uninterrupted; a corrupted save is discarded rather than retried, so a bad write can never wedge the game on a failing load.

To start over, open **게임 가이드 (?)** → *"테라리움 처음부터 다시 시작"*. It asks for confirmation, then discards the save, reseeds the jar and relocks the species codex.

## 6. Repository Layout

```
OpenAIGameBuildersSeoul/
├── AGENTS.md               # Operating rules for coding agents (Korean-only responses)
├── README.md               # This file
├── eco-terrarium/          # ⭐ The game — all commands run from here
│   ├── src/
│   │   ├── app/            # React composition root (features' public APIs only)
│   │   ├── shared/kernel/  # Stable vocabulary shared across contexts
│   │   ├── features/       # Lightweight-DDD bounded contexts
│   │   │   ├── ecosystem/  #   environment, simulation, genetics, canvas
│   │   │   ├── species/    #   codex, individual inspection
│   │   │   ├── progression/#   quests, achievements
│   │   │   ├── customization/# jar, soil, background themes
│   │   │   ├── photo/      #   photo mode & snapshot export
│   │   │   ├── hive/       #   DNA share codec, local autosave, visitor mode
│   │   │   ├── audio/      #   Web Audio infrastructure
│   │   │   ├── showcase/   #   judge quick tour
│   │   │   └── onboarding/ #   play guide
│   │   └── test/           # 8 Vitest suites
│   ├── docs/               # DoD gate, architecture, feature protocol, task cards
│   ├── PRD.md              # Product spec: mechanics, species, equations, audio
│   ├── REQUIREMENTS.md     # Functional & non-functional requirements
│   └── PLAN.md             # Phase checklist
├── .agents/                # Reusable agent skills (see below)
├── docs/                   # Hackathon reference archive (rules, judging, FAQ, legal)
└── scripts/                # Shared verification scripts
```

## 7. Agent Skills (`.agents/`)

Two skills live in this repo. They are not part of the game — they are guardrails for AI agents working across a multi-project workspace, so an agent never edits the wrong repository or drifts outside an agreed scope.

```
.agents/
├── skills/
│   ├── project-state-ledger/     # The engine: CLI + templates + tests
│   │   ├── SKILL.md
│   │   ├── scripts/validate_context.py
│   │   ├── references/           # PROJECT_STATE / TASK_CONTEXT / task-lock templates
│   │   └── tests/                # 8 tests
│   └── project-orchestrator/     # The procedure: Plan→Build→Verify→Review→Record
│       └── SKILL.md
└── dist/                         # Packaged .skill bundles for distribution
```

### 7.1 What each one does

**`project-state-ledger`** — the machine-checkable half. It maintains three files as one unit: `docs/PROJECT_STATE.md` (progress, decisions, evidence), `.ai-work/TASK_CONTEXT.md` (scope and acceptance criteria) and `.ai-work/task-lock.json` (the single machine-readable source of truth). It enforces a **lease** so only one task runs at a time, an **allowed-write-path manifest** so out-of-scope files cannot be touched, and an optional **fail-closed pre-commit hook**.

**`project-orchestrator`** — the procedural half. It drives a single feature or bug from kickoff to handoff through Plan → Build → Verify → Review → Record, calling the validator at every step and refusing to declare completion without evidence. It requires `project-state-ledger` to be installed alongside it.

### 7.2 Use it directly — no installation

The validator is a plain Python 3 CLI and works immediately:

```bash
# From the repo root
python3 .agents/skills/project-state-ledger/scripts/validate_context.py --help
# → {acquire, release, validate, audit, install}
```

Typical flow:

```bash
LEDGER=.agents/skills/project-state-ledger/scripts/validate_context.py
REPO=$(pwd)

# 1. Install the fail-closed pre-commit hook into a target repo
python3 $LEDGER install --repo-root "$REPO"

# 2. Copy the templates and fill them with real values
mkdir -p .ai-work docs
cp .agents/skills/project-state-ledger/references/TASK_CONTEXT.template.md .ai-work/TASK_CONTEXT.md
cp .agents/skills/project-state-ledger/references/task-lock.template.json  .ai-work/task-lock.json
cp .agents/skills/project-state-ledger/references/PROJECT_STATE.template.md docs/PROJECT_STATE.md

# 3. Acquire a lease (returns a lease_id)
python3 $LEDGER acquire --repo-root "$REPO" --lock .ai-work/task-lock.json \
  --owner "your-name" --ttl-minutes 30

# 4. Validate before every write
python3 $LEDGER validate --repo-root "$REPO" \
  --context .ai-work/TASK_CONTEXT.md --state docs/PROJECT_STATE.md \
  --lock .ai-work/task-lock.json --lease-id <lease_id> \
  --write-path src/features/ecosystem/engine.ts --require-confirmed

# 5. Final check and release
python3 $LEDGER validate --repo-root "$REPO" --context .ai-work/TASK_CONTEXT.md \
  --state docs/PROJECT_STATE.md --lock .ai-work/task-lock.json \
  --lease-id <lease_id> --check-working-tree
python3 $LEDGER release --repo-root "$REPO" --lock .ai-work/task-lock.json --lease-id <lease_id>
```

Verify the skill itself:

```bash
cd .agents/skills/project-state-ledger && python3 -m pytest tests/ -q   # 8 passed
```

### 7.3 Install into an agent runtime

To let a Claude-compatible agent auto-invoke the skills by description, copy both folders into your personal skills directory:

```bash
mkdir -p ~/.claude/skills
cp -R .agents/skills/project-orchestrator  ~/.claude/skills/
cp -R .agents/skills/project-state-ledger  ~/.claude/skills/
```

Copy **both** — `project-orchestrator` declares a hard dependency on `project-state-ledger` and will not function alone. For runtimes that accept packaged bundles, `.agents/dist/*.skill` are ready-made zip archives.

For OpenAI Codex, the repo-level operating rules live in `AGENTS.md`, and the validator above can be invoked directly from any agent shell.

## 8. Verified Status

Every number below was produced by actually running the command, not copied from a plan document.

| Check | Command | Result |
| :--- | :--- | :--- |
| Unit tests | `pnpm test` | ✅ 55 passed, 8 files |
| Production build | `pnpm build` | ✅ `tsc` clean · 342.27 kB JS (100.56 kB gzip) · 41.00 kB CSS · ~1.1 s |
| Skill tests | `pytest tests/ -q` | ✅ 8 passed |
| Skill CLI | `validate_context.py --help` | ✅ 5 subcommands available |
| Network calls | source scan | ✅ none — fully offline |

## 9. Documentation

- **Game specs** — [`eco-terrarium/PRD.md`](eco-terrarium/PRD.md), [`REQUIREMENTS.md`](eco-terrarium/REQUIREMENTS.md), [`PLAN.md`](eco-terrarium/PLAN.md)
- **Engineering rules** — [`eco-terrarium/docs/DEFINITION_OF_DONE.md`](eco-terrarium/docs/DEFINITION_OF_DONE.md), [`ARCHITECTURE.md`](eco-terrarium/docs/ARCHITECTURE.md), [`FEATURE_DEVELOPMENT.md`](eco-terrarium/docs/FEATURE_DEVELOPMENT.md)
- **Hackathon archive** — [`docs/README.md`](docs/README.md) covers the overview, timeline, tracks, submission guidelines, judging criteria, rewards, the 12 guest legends, tech guides, FAQ, official news and legal terms

---

<a name="日本語"></a>

# 日本語

## 1. 動作要件

| 項目 | バージョン | 備考 |
| :--- | :--- | :--- |
| Node.js | 20 以上 | `v22.22.1` で検証済み |
| pnpm | 9 以上 | `11.23.0` で検証済み。npm 10 以上でも動作 |
| ブラウザ | Chrome / Safari / Edge / Firefox 最新版 | モバイル iOS / Android Web 対応 |

APIキー、`.env`、バックエンドは一切不要です。完全にクライアントサイドで、オフラインで動作します。

## 2. クイックスタート

```bash
cd eco-terrarium
pnpm install
pnpm dev
```

**http://localhost:3000** を開きます。ポートが使用中の場合、Vite が自動的に次の空きポートへフォールバックします（`strictPort: false`）。実際のURLはターミナル出力で確認してください。

音を鳴らすには画面を一度クリックしてください。ブラウザは最初のユーザー操作まで `AudioContext` をブロックするため、初回タップ時になめらかに再開します。

### その他のコマンド

```bash
pnpm test       # Vitest ユニットテスト — 8ファイル 55テスト
pnpm build      # tsc + 本番バンドルを dist/ に出力
pnpm preview    # 本番ビルドをポート3000で配信
```

> **注意:** ルート直下に `package.json` はありません。コマンドは必ず `eco-terrarium/` の中で実行してください。

## 3. 遊び方

プレイヤーはキャラクターではなく、**瓶の上にある手**です。生物に直接命令することはできません。環境を変え、あとは数式に委ねます。

### 3.1 4つの環境ダイヤル

| ダイヤル | 操作 | シミュレーションへの影響 | 適正域と極端値 |
| :--- | :--- | :--- | :--- |
| ☀️ **日照** | 上部スライダー / 集光クリック | 生産者の光合成速度、わずかな温度上昇 | **40〜70%** 均衡 · 90%超で藻類異常繁殖・白化 · 10%未満で植物枯死 |
| 💧 **水分** | 降雨スライダー / 雨雲タッチ | 流体抵抗、分解者の活性化、水生生物の繁殖 | **50〜80%** 最適 · 20%未満で干ばつ · 95%超で溺死 |
| 🌡️ **温度** | ヒーター/冷却トグル、−10℃〜45℃ | 代謝量、体力消耗、**突然変異圧** | **18〜26℃** 温帯 · 0℃未満で氷河期（結晶化） · 38℃超で熱帯（突然変異促進） |
| 🧪 **栄養** | 有機飼料の投下 / 変異原の注入 | 微生物の摂食、床の苔の栄養塩濃度 | 適量で成長加速 · 過剰で水質汚染と嫌気性細菌の繁殖 |

その他の操作: **瓶を叩く**と群れに衝撃波が伝わり、**飼料を落とす**と草食生物が群がり、**変異原を注入**すると数秒間だけ突然変異率が跳ね上がります。

### 3.2 ゲームループ

```
観察  →  環境調整  →  シミュレーション演算（ロトカ・ヴォルテラ + Boids）
  ↑                                          ↓
Hive共有  ←  クエスト報酬  ←  種分化・図鑑解放（音楽が豊かになる）
```

新種を発見するたびに、その声が楽曲に加わります。均衡のとれた瓶は、滅びかけの瓶よりも文字通り豊かな音がします。生態系の調和度がコード進行のパレットを直接駆動しているためです。

### 3.3 インスペクター

生物をクリックすると顕微鏡インスペクターが開きます。10個すべての遺伝子数値、リアルタイムのクローズアップ、血統樹、そして名前の変更欄が表示されます。付けた名前はオートセーブと DNA 共有コードの両方に引き継がれます。

### 3.4 審査員向けクイックショーケース

デモとレビュー用のワンクリックプリセット4種:

| プリセット | 見せる内容 |
| :--- | :--- |
| ⚡ **即時繁栄** | 4階層が完全に調和し満開になった瓶を即座にロード |
| 🔥 **突然変異加速** | 栄養＋温度触媒により約5秒で新種が進化 |
| ❄️ **氷河期脱出** | −5℃の環境でクリスタルリーフと低温適応生物が生き延びる劇 |
| 🎵 **交響曲** | 全バイオ和音レイヤーを一斉に鳴らすフルオーケストレーション |

## 4. 生物図鑑と進化系統

4つの栄養段階にまたがる16種が、閉じた物質循環をつくります。生産者が草食生物を養い、草食生物が捕食者を養い、捕食者の死骸が分解者を養い、分解者が栄養を生産者に還します。

```
🌿 生産者              🫧 草食              👁️ 捕食者            🍄 分解者
─────────────         ─────────────         ─────────────         ─────────────
ルミフローラ           ジェリーウィグル       ファントムリップ       ミセルリンカー
  ├ ソーラーブルーム      ├ グロウテイル         ├ スパイクハンター     ├ バイオ精製器
  │  (日照 > 80%)        │  (速度遺伝子)        │  (攻撃性遺伝子)      │  (酸素浄化特化)
  ├ アクアケルプ          ├ シェルポッド         └ ネビュラクラーケン   └ エーテルスポア
  │  (水分 > 85%)        │  (防御遺伝子)           (4階層が120秒        (稀少変異)
  └ クリスタルリーフ      └ オーロラフィン           共存)
     (温度 < 5℃)           (温度 > 35℃
                             ＋触媒)

     └──── 捕食 ────→ └──── 捕食 ────→ └──── 死骸 ────→ └──── 有機栄養 ────┐
     ↑                                                                        │
     └────────────────────────────────────────────────────────────────────────┘
```

さらに2種が特殊条件下でのみ出現します。**コズミックプランクトン**（4階層が完全な調和に達したとき）と**プリズムアメーバ**（周囲の光に応じて体色がリアルタイムに変化）です。

見どころ: **ネビュラクラーケン**は伝説の守護者で、4つの栄養段階が120秒間共存して初めて現れる銀河模様のミニクラーケンです。**エーテルスポア**は青緑の胞子を撒き、次世代の進化を加速させます。**シェルポッド**は半透明の甲羅で捕食攻撃をちょうど1回だけ防ぎます。

## 5. 技術的な内部構造

### 5.1 シミュレーション

栄養塩 `N`、生産者 `P`、草食 `C`、捕食者 `H`、分解者 `D` を対象とする拡張ロトカ・ヴォルテラ系を、**4次ルンゲ・クッタ法**で数値積分します:

```
dN/dt = κ·D − α_N·P·N + Input_nutrient
dP/dt = r(S,M,T)·P·(1 − P/K(N)) − β·P·C
dC/dt = ε_C·β·P·C − γ·C·H − μ_C(T)·C
dH/dt = ε_H·γ·C·H − μ_H(T)·H
dD/dt = δ·Corpses − μ_D·D
```

成長項は環境に対するガウス型の最適曲線として定義されます:

```
r(S,M,T) = r_max · (S/100) · (M/100) · exp( −(T − T_opt)² / 2σ_T² )
```

この個体群レベルの常微分方程式に加えて、各個体は有限状態機械（徘徊 / 採餌 / 交配 / 逃走 / 分解）と、流体粘性下での **Boids** の結合・分離・整列ステアリングによって個別にシミュレートされます。

### 5.2 遺伝アルゴリズム

各個体は10次元の遺伝子ベクトルを持ちます:

```
g = [ サイズ, 速度, 代謝, 最適温度, 温度許容差, 最適水分,
      色相, 突然変異率, 防御, 生体発光 ]
```

子孫は `g_child = g_parent + N(0, σ²) + P_env` を継承します。`P_env` は**環境圧ベクトル**です。瓶を高温に保てば、世代を重ねるうちに遺伝子は自ずと耐熱方向へドリフトします。種分化はスクリプトではなく創発的に起こります。

### 5.3 プロシージャルオーディオ

音源ファイルはゼロ。すべて Web Audio API で3層構成にリアルタイム合成しています。

- **アンビエントパッド** — デュアルオシレーター（サイン＋トライアングル）＋ LFO フィルタースイープ
- **バイオチャイム** — 摂食・分裂・進化で発火する ADSR グロッケンシュピールのピン音
- **ネイチャーフォーリー** — 雨はバンドパスされたピンクノイズ、陽射しは高域シマーの倍音、瓶を叩く音は 2200Hz の減衰ベル

和声パレットは C メジャー / A ペンタトニックから始まり、生態系の調和度が上がるにつれて9th・11thのテンションを獲得し、リディアン旋法へと発展します。

### 5.4 共有機能

瓶の全状態 — 環境値、個体数、代表的な遺伝子プール、カスタムスキンID — を JSON 化し、`lz-string` で圧縮して、URLディープリンク（`?dna=...`、別名として `?code=...` も受理）と `ECO-XXXX-XX` 形式の短縮コードの両方で出力します。リンクを開くと他人の生態系がそのまま再構築されます。

> 訪問モード、花粉のギフト、グローバルリーダーボードは、**モックのランキングデータを用いたローカルの Hive 風デモ層**として実装されています。設計は Com2uS Hive 対応を想定していますが、このビルドに実際の Hive SDK は接続されていません。

### 5.5 アクセシビリティ

全アニメーションで `prefers-reduced-motion` を尊重し、生態系の状況は `aria-live` リージョンで読み上げられます。ユーザー操作前に音声が自動再生されることはありません。

### 5.6 オートセーブ

ゲームに入ると、テラリウムとクエストの達成状況が10秒ごと、およびタブが非表示・終了されるたびに `localStorage` へ書き込まれます。ページを開き直せば中断した地点からそのまま再開できます。

共有ディープリンクは常にローカルセーブより優先されるため、他の人の `?dna=` リンクを開いたときに自分の瓶が黙って読み込まれることはありません。ストレージが使えない場合（Safari のプライベートモード、容量超過）は保存が静かに失敗するだけでプレイは中断されず、破損したセーブは再試行せず破棄されるので、書き込み失敗でゲームがロード不能に陥ることはありません。

最初からやり直すには、**ゲームガイド（?）** →「テラリウムを最初からやり直す」を選びます。確認をはさんだうえで、セーブを破棄し、瓶を再生成し、図鑑の解放状態も初期に戻します。

## 6. リポジトリ構成

```
OpenAIGameBuildersSeoul/
├── AGENTS.md               # コーディングエージェント向け運用規則（応答は韓国語）
├── README.md               # このファイル
├── eco-terrarium/          # ⭐ ゲーム本体 — 全コマンドはここで実行
│   ├── src/
│   │   ├── app/            # React合成ルート（機能の公開APIのみ利用）
│   │   ├── shared/kernel/  # 複数コンテキストが共有する安定した語彙
│   │   ├── features/       # 軽量DDDの境界づけられたコンテキスト
│   │   │   ├── ecosystem/  #   環境・シミュレーション・遺伝・Canvas
│   │   │   ├── species/    #   図鑑・個体観察
│   │   │   ├── progression/#   クエスト・実績
│   │   │   ├── customization/# ボトル・土壌・背景テーマ
│   │   │   ├── photo/      #   写真モード・スナップショット出力
│   │   │   ├── hive/       #   DNA共有コーデック・ローカルオートセーブ・訪問モード
│   │   │   ├── audio/      #   Web Audio インフラ
│   │   │   ├── showcase/   #   審査員クイックツアー
│   │   │   └── onboarding/ #   プレイガイド
│   │   └── test/           # Vitest 8スイート
│   ├── docs/               # DoDゲート、アーキテクチャ、機能開発手順、作業カード
│   ├── PRD.md              # 製品仕様: メカニクス・生物・数式・オーディオ
│   ├── REQUIREMENTS.md     # 機能／非機能要件
│   └── PLAN.md             # フェーズチェックリスト
├── .agents/                # 再利用可能なエージェントスキル（後述）
├── docs/                   # ハッカソン資料アーカイブ（規定・審査・FAQ・規約）
└── scripts/                # 共有の検証スクリプト
```

## 7. エージェントスキル（`.agents/`）

このリポジトリには2つのスキルが含まれています。ゲームの一部ではなく、**複数プロジェクトが同居する作業空間で AI エージェントが誤ったリポジトリを編集したり、合意した範囲から逸脱したりするのを防ぐガードレール**です。

```
.agents/
├── skills/
│   ├── project-state-ledger/     # 本体: CLI + テンプレート + テスト
│   │   ├── SKILL.md
│   │   ├── scripts/validate_context.py
│   │   ├── references/           # PROJECT_STATE / TASK_CONTEXT / task-lock テンプレート
│   │   └── tests/                # 8テスト
│   └── project-orchestrator/     # 手順: Plan→Build→Verify→Review→Record
│       └── SKILL.md
└── dist/                         # 配布用にパッケージ済みの .skill バンドル
```

### 7.1 それぞれの役割

**`project-state-ledger`** — 機械判定を担う側です。3つのファイルを一体として管理します: `docs/PROJECT_STATE.md`（進捗・決定・根拠）、`.ai-work/TASK_CONTEXT.md`（範囲と受入基準）、`.ai-work/task-lock.json`（機械可読な単一の判定基準）。同時に1作業のみを許す**リース**、範囲外ファイルの変更を禁じる**書き込み許可パスのマニフェスト**、任意で導入できる**フェイルクローズドな pre-commit フック**を強制します。

**`project-orchestrator`** — 手続きを担う側です。ひとつの機能やバグを着手から引き継ぎまで Plan → Build → Verify → Review → Record で駆動し、各段階で上記バリデーターを呼び出し、根拠がないまま完了を宣言することを拒みます。動作には `project-state-ledger` の同時インストールが必要です。

### 7.2 インストール不要ですぐ使う

バリデーターは素の Python 3 CLI なので、そのまま実行できます:

```bash
# リポジトリのルートから
python3 .agents/skills/project-state-ledger/scripts/validate_context.py --help
# → {acquire, release, validate, audit, install}
```

典型的な流れ:

```bash
LEDGER=.agents/skills/project-state-ledger/scripts/validate_context.py
REPO=$(pwd)

# 1. 対象リポジトリにフェイルクローズドな pre-commit フックを導入
python3 $LEDGER install --repo-root "$REPO"

# 2. テンプレートをコピーして実際の値で埋める
mkdir -p .ai-work docs
cp .agents/skills/project-state-ledger/references/TASK_CONTEXT.template.md .ai-work/TASK_CONTEXT.md
cp .agents/skills/project-state-ledger/references/task-lock.template.json  .ai-work/task-lock.json
cp .agents/skills/project-state-ledger/references/PROJECT_STATE.template.md docs/PROJECT_STATE.md

# 3. リースを取得（lease_id が返る）
python3 $LEDGER acquire --repo-root "$REPO" --lock .ai-work/task-lock.json \
  --owner "your-name" --ttl-minutes 30

# 4. 書き込みのたびに検証
python3 $LEDGER validate --repo-root "$REPO" \
  --context .ai-work/TASK_CONTEXT.md --state docs/PROJECT_STATE.md \
  --lock .ai-work/task-lock.json --lease-id <lease_id> \
  --write-path src/features/ecosystem/engine.ts --require-confirmed

# 5. 最終確認とリリース
python3 $LEDGER validate --repo-root "$REPO" --context .ai-work/TASK_CONTEXT.md \
  --state docs/PROJECT_STATE.md --lock .ai-work/task-lock.json \
  --lease-id <lease_id> --check-working-tree
python3 $LEDGER release --repo-root "$REPO" --lock .ai-work/task-lock.json --lease-id <lease_id>
```

スキル自体の検証:

```bash
cd .agents/skills/project-state-ledger && python3 -m pytest tests/ -q   # 8 passed
```

### 7.3 エージェントランタイムへ導入する

Claude 互換のエージェントが説明文から自動でスキルを呼び出せるようにするには、両フォルダを個人スキルディレクトリへコピーします:

```bash
mkdir -p ~/.claude/skills
cp -R .agents/skills/project-orchestrator  ~/.claude/skills/
cp -R .agents/skills/project-state-ledger  ~/.claude/skills/
```

**必ず両方**コピーしてください。`project-orchestrator` は `project-state-ledger` への依存を明示しており、単独では機能しません。バンドル形式を受け付けるランタイム向けには、`.agents/dist/*.skill` がそのまま使える zip アーカイブです。

OpenAI Codex の場合、リポジトリレベルの運用規則は `AGENTS.md` に置かれており、上記バリデーターは任意のエージェントシェルから直接呼び出せます。

## 8. 検証済みステータス

以下の数値はすべて、計画書からの転記ではなく実際にコマンドを実行して得たものです。

| 検証項目 | コマンド | 結果 |
| :--- | :--- | :--- |
| ユニットテスト | `pnpm test` | ✅ 55件成功 / 8ファイル |
| 本番ビルド | `pnpm build` | ✅ `tsc` エラーなし · JS 342.27 kB（gzip 100.56 kB）· CSS 41.00 kB · 約1.1秒 |
| スキルのテスト | `pytest tests/ -q` | ✅ 8件成功 |
| スキルのCLI | `validate_context.py --help` | ✅ サブコマンド5種が利用可能 |
| ネットワーク通信 | ソース走査 | ✅ なし — 完全オフライン |

## 9. ドキュメント

- **ゲーム仕様** — [`eco-terrarium/PRD.md`](eco-terrarium/PRD.md)、[`REQUIREMENTS.md`](eco-terrarium/REQUIREMENTS.md)、[`PLAN.md`](eco-terrarium/PLAN.md)
- **開発規約** — [`eco-terrarium/docs/DEFINITION_OF_DONE.md`](eco-terrarium/docs/DEFINITION_OF_DONE.md)、[`ARCHITECTURE.md`](eco-terrarium/docs/ARCHITECTURE.md)、[`FEATURE_DEVELOPMENT.md`](eco-terrarium/docs/FEATURE_DEVELOPMENT.md)
- **ハッカソン資料** — [`docs/README.md`](docs/README.md) に概要、日程、トラック、提出ガイドライン、審査基準、リワード、12名のレジェンド、技術ガイド、FAQ、公式ニュース、参加規約を収録
