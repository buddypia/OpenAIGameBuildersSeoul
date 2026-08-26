# 作業カード: 軽量DDDへの機能コンテキスト移行

## 1. 作業概要

- **作業名**: 技術別構造から軽量DDDの機能コンテキスト構造への移行
- **ユーザー価値 / 解決する問題**: 今後の開発者・エージェントが、要件とPRDを起点に機能の所有場所、依存方向、検証方法を一貫して判断できる。
- **関連根拠**: ユーザー依頼、FR-ENV-01〜05、FR-SIM-01〜03、FR-BIO-01〜02、FR-AUD-01〜03、FR-PROG-01〜03、FR-HIVE-01〜03、FR-JUDGE-01〜02、NFR-PERF-01〜03、NFR-UX-01〜02、`PRD.md` 全体、`PLAN.md` Phase 3〜10。
- **範囲**: 現存する全機能の物理配置をコンテキスト別に移行する。公開API、共通語彙、構造テスト、開発プロトコル、READMEを追加・更新する。
- **非範囲**: ゲームルール、画面デザイン、DNAスキーマ、依存パッケージ、外部Hiveバックエンドの変更。
- **影響領域**: シミュレーション / UI / オーディオ / 保存・共有 / 文書・設定。

## 2. 完了の定義 (DoD)

| ID | 検証可能な受入基準 | 検証方法 | 判定 | 証拠 |
| --- | --- | --- | --- | --- |
| DOD-01 | 全既存機能が所有コンテキストとFR根拠を持ち、旧技術別ディレクトリを使わない | `ARCHITECTURE.md`のコンテキストマップ、構造テスト | 通過 | 9コンテキストをFRへ対応付け。`architecture.test.ts` が旧6ディレクトリの不在を確認。 |
| DOD-02 | `app`とテストが各コンテキストの公開APIを使い、内部パスへ依存しない | `architecture.test.ts` とコードレビュー | 通過 | `App.tsx` と既存4テスト群はfeature rootの公開APIを使用。構造テストが内部層へのapp importを拒否。 |
| DOD-03 | ドメインがReact/Canvas/Web Audioへ直接依存せず、外部技術が適切な層に隔離される | 構造テストとimportレビュー | 通過 | `architecture.test.ts` が全domainソースのReact・presentation・browser API依存を拒否。Audio/DNAはinfrastructure、React/Canvasはpresentationへ配置。 |
| DOD-04 | 既存のシミュレーションとDNA互換性のテストが移行後の公開API経由で通る | `pnpm test` | 通過 | 5ファイル、28テスト通過。DNA往復・v1.0互換・破損入力、エンジン不変条件、遺伝・数理を含む。 |
| DOD-05 | 今後の機能追加で要件・PRD・PLAN・DoD・検証を参照する手順が文書化される | 文書のリンク・パス・命令を確認 | 通過 | `ARCHITECTURE.md` と `FEATURE_DEVELOPMENT.md` を追加し、READMEからリンク。4文書のローカルMarkdownリンク検証が成功。 |
| DOD-06 | 型検査と本番ビルドが通る | `pnpm build` | 通過 | `tsc && vite build` 成功。1,621モジュールを変換し、出力バンドルを生成。 |

## 3. 実装・検証計画

- **変更対象**: `src/app`、`src/shared/kernel`、各 `src/features/<context>`、`src/test`、`README.md`、`docs/ARCHITECTURE.md`、`docs/FEATURE_DEVELOPMENT.md`。
- **自動検証**: `pnpm test`、`pnpm build`。
- **手動検証**: 開発サーバーで環境操作、Canvas入力、図鑑、Hive共有モーダル、審査員プリセットを開き、レイアウトを確認する。
- **境界・失敗条件**: 破損DNA、旧v1.0.0 DNA、停止中のシミュレーション、上限個体数、音声未初期化。
- **互換性・性能・アクセス性**: 公開DNAを変更しない。Canvas・UIコードは同一実装を移動するため、既存の上限・入力・レスポンシブ挙動を回帰確認する。
- **リスクとロールバック**: 移動によるimport解決失敗、隠れた外部import。公開入口と構造テストで検出する。ロールバックは移動前の技術別パスへ戻し、READMEとテストimportを復元する。

## 4. 完了記録

- **変更概要**: `src/app` を合成ルートにし、技術別フォルダを9つの機能コンテキストへ移行した。各コンテキストに公開入口を設け、共通語彙を `src/shared/kernel` に集約した。構造テスト、アーキテクチャ規約、機能開発プロトコル、READMEを追加・更新した。
- **実行したコマンドと結果**:
  - `pnpm test` — 5テストファイル、28テスト通過。
  - `pnpm build` — TypeScript検査とVite本番ビルド通過。
  - Playwright（production preview、1280px）— Canvasを起動し、図鑑モーダルを開く導線を通過。ページ例外なし。
  - Playwright（production preview、320px）— Canvasとゲームガイド操作を確認。
  - Markdownリンク検証 — READMEと3つのDDD関連文書のローカルリンクをすべて確認。
- **DoD最終判定**: すべて通過。
- **既知の制限と後続作業**: 構造は軽量に保つため、現時点で複数UIをまたぐ複雑なユースケースはない。必要になったコンテキストにだけ `application/` を追加する。共有カーネルの肥大化はPRレビューで防ぐ。
