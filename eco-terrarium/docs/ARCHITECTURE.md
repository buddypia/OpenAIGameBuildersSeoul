# 軽量DDDアーキテクチャ

最終更新: 2026-08-25

## 目的

このプロジェクトは、ゲーム全体を技術別フォルダで分けるのではなく、プレイヤー価値と業務ルール（ゲームルール）ごとの**境界づけられたコンテキスト**で分ける。これにより、今後の変更が `REQUIREMENTS.md`、`PRD.md`、`PLAN.md` のどの要件を実現するか追跡でき、表示・Web Audio・共有形式の変更がシミュレーション規則を巻き込まないようにする。

これは軽量DDDである。エンティティ、リポジトリ、CQRSなどを形式だけで増やさない。ドメインルールがある箇所だけを分離し、Reactアプリに必要な最小限の構造を維持する。

## レイヤーと依存方向

```
app（合成・画面状態）
  └── features/<context>/index.ts（公開APIのみ）
        ├── presentation（React / Canvas UI）
        ├── application（ユースケース。必要になった時だけ追加）
        ├── infrastructure（Web API、コーデックなどの外部技術）
        └── domain（ゲーム規則・計算・不変条件）
              └── shared/kernel（複数コンテキストで使う安定した語彙）
```

- `src/app` は合成ルートであり、機能間のUI連携と短命な画面状態だけを持つ。機能内部パスを直接importしない。
- 各 `features/<context>/index.ts` はそのコンテキストの唯一の公開入口。別コンテキストやテストはここを使う。
- `domain` は React、Canvas、Web Audio、`window`、`localStorage` に依存しない。`EcosystemEngine` の通知は `SimulationCallbacks` というポートで渡す。
- `infrastructure` はブラウザやライブラリへの依存を隔離する。例: Hive DNAのLZString、Web Audio API。
- `presentation` は表示とユーザー入力を担当し、ゲーム規則を複製しない。
- `shared/kernel` は `EnvironmentState`、`Genome`、`Organism` などの安定した共通語彙だけを置く。機能固有のルールは置かない。

## コンテキストマップ

| コンテキスト | 責務 | 主要な根拠 | 公開入口 |
| --- | --- | --- | --- |
| `ecosystem` | 環境操作、4階層生態系、遺伝、進化、Canvas観察 | FR-ENV-01〜05, FR-SIM-01〜03, NFR-PERF-01〜03 | `src/features/ecosystem/index.ts` |
| `species` | 図鑑と個体インスペクター | FR-BIO-01〜02 | `src/features/species/index.ts` |
| `progression` | クエストと進行判定 | FR-PROG-01 | `src/features/progression/index.ts` |
| `customization` | ボトル、土壌、背景の選択 | FR-PROG-02 | `src/features/customization/index.ts` |
| `photo` | 写真モードと書き出し | FR-PROG-03 | `src/features/photo/index.ts` |
| `hive` | DNA共有・インポート検証・訪問UI | FR-HIVE-01〜03 | `src/features/hive/index.ts` |
| `audio` | Web Audioの適応サウンド | FR-AUD-01〜03, NFR-UX-01 | `src/features/audio/index.ts` |
| `showcase` | 審査員プリセットと開発ストーリー | FR-JUDGE-01〜02 | `src/features/showcase/index.ts` |
| `onboarding` | プレイガイドと初回理解 | NFR-UX-02 | `src/features/onboarding/index.ts` |

依存関係の要点は、`hive` が共有カーネルのスナップショットを検証・転送するが、生態系の規則を実装し直さないこと、`audio` と `presentation` が `ecosystem` の状態を消費してもルールを変更しないことである。

## 現在の物理配置

```
src/
├── app/                         # React合成ルート
├── shared/kernel/               # 共通語彙（型・DTO）
└── features/
    ├── ecosystem/{domain,presentation}/
    ├── audio/infrastructure/
    ├── species/presentation/
    ├── progression/{domain,presentation}/
    ├── customization/presentation/
    ├── photo/presentation/
    ├── hive/{infrastructure,presentation}/
    ├── showcase/presentation/
    └── onboarding/presentation/
```

`application/` は、複数のUIから呼ばれるユースケース、トランザクション境界、外部ポートが生じたコンテキストにだけ追加する。単一画面だけの単純な状態更新を無理にクラス化しない。

## 互換性の重要契約

- Hive DNAは公開データ契約である。`decodeEcosystemDNA` は未信頼入力を検証し、v1.0.0の `sampleOrganisms` を現在の `organisms` へ正規化する。形式変更には新旧の往復・破損入力テストが必須。
- `EcosystemEngine` は個体数上限、停止時の不変性、死骸循環、有限な統計値を守る。挙動変更には対応するドメインテストを追加する。
- `features/*/index.ts` は意図的な公開契約である。内部ファイルのパスを外部コードへ公開しない。

## 開発時の判断順序

1. `REQUIREMENTS.md` のFR/NFR、`PRD.md` のゲームループ、`PLAN.md` の該当フェーズを読む。
2. この文書のコンテキストマップで所有コンテキストを決める。二つにまたがる場合は、どちらがルールを所有し、どちらが公開APIを消費するかを決める。
3. `docs/TASK_TEMPLATE.md` で範囲、非範囲、リスク、FR、DoD、検証方法を記録する。
4. ルール・不変条件は `domain`、UIから使う操作の調整は `application`、ブラウザI/Oは `infrastructure`、React/Canvasは `presentation` に置く。
5. 新しい外部利用対象は `index.ts` から明示的にexportする。内部実装のimportを増やさない。
6. 正常・失敗・境界ケースをテストし、`pnpm test` と `pnpm build` を実行する。完了報告は `docs/DEFINITION_OF_DONE.md` に従う。

## 変更時に避けること

- 技術名だけの横断フォルダ（新しい `components/`、`utils/`、`services/`、`simulation/`）へ戻すこと。
- ドメインで `window`、React hook、Web Audio、Canvasを直接参照すること。
- 一時的な画面都合で共有カーネルに機能固有ルールを追加すること。
- DNAスキーマをバージョン・移行・互換性テストなしに変更すること。
- PRDや要件と結び付かない「将来使うかもしれない」抽象化を追加すること。

## 構造の自動検証

`src/test/architecture.test.ts` は、旧技術別ディレクトリが戻っていないこと、各機能に公開APIがあること、`app` が内部実装ではなく公開APIだけに依存すること、ドメインがUIライブラリに依存しないことを確認する。新しいコンテキストを追加したら、その公開入口とテストの期待リストも更新する。
