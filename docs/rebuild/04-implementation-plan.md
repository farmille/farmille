# 04 実装計画 — マイルストーン・タスク分割・委譲

前提：[00-overview.md](00-overview.md)〜[03-architecture.md](03-architecture.md)。バックエンドは Next.js 集約で確定（D2）。

## 1. 進め方の原則

- **設計の正は docs/rebuild/**。実装中に矛盾・不明が出たら、コードで勝手に解釈せずタスクの「質問すべき条件」に従って止まる
- **界面を先に凍結**：DB スキーマ（01）→ 型生成（database.types.ts）→ 画面（02）の順に依存する。M1 のスキーマ確定後は、スキーマ変更を伴うタスクは必ず単独 PR に分離する
- **1タスク＝1ブランチ＝1 worktree＝1エージェント**。同一ファイルを触るタスクを並行させない。タスク指示書は docs/rebuild/tasks/T-xx.md（後述の様式）に置き、それ単体で完遂できる水準で書く
- **クロスレビュー**：実装したモデルと別系統のモデル（または人間）がレビューしてからマージ。設計判断を含む PR は必ず Opus 5 か人間が見る
- 完了報告は「変更点・実行した検証（成功／失敗／skip）・未確認事項」の3点セット。検証を通していないものを完了と呼ばない

## 2. マイルストーン

依存関係：M0 → M1 → M2 → M3 → M4 → M5（M2 と M3 の一部は並行可）。

### M0 足場（依存なし・すべて並行可）

| ID | タスク | 担当（推奨） |
|---|---|---|
| T-01 | リポジトリ掃除：05 の削除リスト実行・docs/ops/ への移設・ルート AGENTS.md（実体）と CLAUDE.md（`@AGENTS.md` の1行）を新体制の内容へ全面書き換え | Opus 5 |
| T-02 | アプリ再初期化：旧 src/ 一掃・Panda CSS 導入・oxlint/oxfmt/ESLint ハイブリッド設定・`src/env.ts`（fail fast）・`src/server/` の器・vitest 維持 | Sol |
| T-03 | デザイントークン実装：02 §5 を panda.config.ts に定義（**ライトのみ**）・`next/font` の Noto Sans JP 設定・スタイルガイドページ（/dev/tokens、本番ビルド除外） | Grok |
| T-04 | CI：GitHub Actions（oxlint＋eslint／oxfmt --check／tsc／vitest／build。migration 差分があれば gen:types 差分チェック） | Sol |
| T-05 | OpenSpec 限定導入（`openspec init --tools claude,cursor,codex`）と運用手順1枚 | Opus 5 |
| T-06 | 【人間】Supabase の鍵移行とローテーション（新 API キー＋JWT Signing Keys へ移行 → 新アプリは新キーで構築 → Cloud Run 廃止時に旧キー無効化）・Cloud Build ソースバケットに残る旧アップロードの削除・Supabase CLI アクセストークンの再発行・Vercel 環境変数整備 | Shun |

### M1 データ基盤（T-11 が全体のボトルネック。最優先）

| ID | タスク | 担当（推奨） |
|---|---|---|
| T-11 | v2 スキーマ migration 一式（01 §3・§5・§6 の全テーブル・RLS・公開ビュー・集計トリガー）＋ タグ／作物マスタのシード（モックの語彙を初期値に） | Opus 5 ※RLS は正確性最優先 |
| T-12 | 旧スキーマの資材マスタ294件エクスポート → 変換 → 新スキーマ投入（tools/migration/）。件数・サンプル照合レポート付き | Sol |
| T-13 | 認証基盤：一般 signup／login／password-reset、出品者ログイン（ID→合成メール解決）、admin AAL2 ガード、proxy.ts の保護パス設計 | Opus 5 |
| T-14 | `gen:types` 再整備と `src/server/` の実装（Supabase クライアント・エラー辞書・`{ok,error}` ヘルパ・ページネーション・共通クエリ） | Sol |

### M2 閲覧系（T-11 完了後。画面単位で並行可）

| ID | タスク | 担当（推奨） |
|---|---|---|
| T-21 | 共通 UI キット：AppBar／BottomNav／FabBar／各カード／TagChip／StarRating／FilterPills（02 §5。モックの見た目を忠実に再現） | Grok |
| T-22 | ホーム＋タグ検索（同一分類 OR・分類間 AND・オートコンプリート・並び替え実装） | Grok |
| T-23 | 資材詳細＋レビュー全件一覧＋資材の関連記事（保存トグル・対照区あり率・Q&A 非表示） | Sol |
| T-24 | 記事一覧・記事詳細・使用レポート閲覧（公開側） | Grok |
| T-25 | 出品者ページ（seller/sellerJA 統合・0件分岐）・公開プロフィール | Grok |
| T-26 | SEO 基盤：metadata・OGP・sitemap・構造化データ（Review/Product） | Sol |

### M3 投稿系（M2 の共通 UI に依存）

| ID | タスク | 担当（推奨） |
|---|---|---|
| T-31 | 投稿先選択＋レビュー投稿（星タップ入力・写真アップロード・農薬同意ブロック・完了分岐）＋編集・削除 | Sol |
| T-32 | 使用レポート投稿フォーム（6セクション・作物タブ・カレンダー・収穫調査・下書き保存。モック最大の複雑フォーム） | Sol ※状態管理が重い |
| T-33 | マイページ（3棚）・プロフィール編集・検討リスト・資材比較 | Grok |
| T-34 | 参考になった・閲覧イベント・通報モーダル | Sonnet 5 |

### M4 出品者・運営系

| ID | タスク | 担当（推奨） |
|---|---|---|
| T-41 | 出品者申請〜受付完了・招待コード | Grok |
| T-42 | 出品者ダッシュボード（自社資材・一次情報編集・エビデンス管理・分類変更申請） | Sol |
| T-43 | 記事投稿・編集（出品者） | Grok |
| T-44 | admin：出品者審査（承認＝Auth ユーザー発行）・資材登録／claim・タグ管理 | Opus 5 ※Auth Admin API・権限境界 |
| T-45 | admin：通報処理・使用レポート編集局（pending 調整→公開） | Sol |

### M5 仕上げ・リリース

| ID | タスク | 担当（推奨） |
|---|---|---|
| T-51 | Playwright E2E（主要8フロー：登録→投稿→公開／出品者申請→承認→一次情報編集 等） | Sol |
| T-52 | Sentry・GA4 組み込み、404／error 画面、パフォーマンス確認（LCP・画像最適化） | Grok |
| T-53 | 本番切替 runbook：旧テーブル DROP・Cloud Run 廃止・Vercel cron 削除・DNS 確認・ロールバック手順 | Opus 5＋人間 |
| T-54 | 全画面のモック照合レビュー（見た目の最終品質判定は人間） | 人間＋Opus 5 |

## 3. 委譲の実務（ツール別）

2026-07 時点の確認済みコマンド。着手時に各ツールの最新ドキュメントで再確認すること。**実装タスクでは Opus 5・Sol とも reasoning effort を既定で xhigh にする**（D14）。設計判断・RLS・認可のような取り返しのつかない領域を含むため、速度より正確性を優先する。

| 系統 | モデル指定 | 既定 effort |
|---|---|---|
| Claude Code | `claude-opus-5`（軽作業のみ `claude-sonnet-5`） | **xhigh** |
| Codex | `gpt-5.6-sol` | **xhigh** |
| Cursor | `cursor-grok-4.5-high-fast` | （High Fast がモデル側の設定に含まれる） |

### Claude Code（Opus 5 / Sonnet 5）— 正確性が要る基盤・権限・レビュー係

- 起動：`claude --worktree T-11`（worktree 内蔵）。ヘッドレスは `claude -p "$(cat docs/rebuild/tasks/T-11.md)" --permission-mode acceptEdits`
- effort：セッションの reasoning effort を xhigh に設定してから着手する（`/config` の Reasoning effort、またはヘッドレス起動時の同等設定）
- モデル：スキーマ・RLS・認証・admin は Opus 5。定型的な小タスク（T-34 等）のみ Sonnet 5 に落とす
- GitHub 連携（任意）：`anthropics/claude-code-action@v1` で PR コメント駆動の修正が可能
- 役割分担上の特記：**他モデルの PR レビュー担当**を兼ねる（RLS・認可・スキーマ整合・03 §8 の実装規約の観点）

### Codex Sol（GPT-5.6 Sol）— 複雑フォーム・スクリプト・テスト

- 起動：`codex exec -m gpt-5.6-sol -c model_reasoning_effort="xhigh" --sandbox workspace-write "$(cat docs/rebuild/tasks/T-32.md)"`。継続は `codex exec resume --last "追加指示"`
- 対話で使う場合は `/model` から「gpt-5.6-sol xhigh」を選ぶ（reasoning effort 込みで選択する UI）
- git worktree を手動で切ってから実行（1タスク1 worktree）：`git worktree add ../farmille-T32 -b feat/T-32`
- 制約：実効コンテキスト約272Kトークン。**指示書は自己完結させ、リポジトリ全体を読ませない**（対象ファイル・参照ドキュメントを明示列挙）
- リポジトリの `AGENTS.md` に検証コマンドと規約を書いておく（Codex が自動参照）

### Cursor Grok 4.5 High Fast — 画面実装の量産・ビジュアル再現

- モデル：**`cursor-grok-4.5-high-fast`**（Cursor の内部スラッグ。UI 表示名は "Grok 4.5 High Fast"。旧スラッグ `grok-4.5-fast-xhigh` から改名済み）。High が reasoning effort、Fast が優先処理の serving 指定にあたる
- 料金：ベースの Grok 4.5 が $2/M 入力・$6/M 出力に対し、Fast は **$4/M 入力・$18/M 出力**。出力単価が3倍になるため、大量生成が続くタスクでは消費を確認する
- 起動：`agent -p --force "$(cat docs/rebuild/tasks/T-21.md)"`（CLI は beta。`--output-format json` で結果回収）。モデルはセッションのモデルピッカーか設定で指定する。エディタ側の Background Agent＋Worktree 機能でも可
- 強み：モック HTML（reference/mockup-sp-19screens.html）を参照させた見た目の再現。タスク指示書に該当画面のスクリーンショット手順とモックの該当セクションを明記する

### 人間（Shun）にしかできないこと

- T-06 の secret ローテーション、Supabase／Vercel ダッシュボード操作、招待・審査の運用判断、T-54 の最終品質判定、各マイルストーン末のマージ承認

### タスク指示書の様式（docs/rebuild/tasks/T-xx.md）

各タスクは着手前に指示書化する（本計画の表は要約であり、指示書が実行単位）。必須構成：①役割設定 ②制約（触ってよいファイル範囲・禁止事項） ③背景（参照すべき docs/rebuild の節） ④対象ファイル ⑤実装方針（手順・データ構造・文言例） ⑥検証（実行コマンドと成功定義。UI は実画面確認まで） ⑦質問すべき条件。指示書の作成は Claude Code（本セッション系）が担い、実装モデルへ渡す。

**UI を含むタスクの定型制約（全指示書に必ず含める）**：
- 画面は共通 UI キット（src/components/）の部品で組む。ページ側での `styled-system/*` 直接使用によるキット迂回は不可（レイアウト調整のみ可・03 §8）
- **不足コンポーネントが出たら、その画面タスク内で発明せず「キットへ追加する小 PR（別ブランチ）を先に切る」**。追加が済んでから画面タスクを再開する
- 完了報告には**モック同一画面との2枚並べスクリーンショット**（375px）を添付する（モックに無い新規画面のみ単独で可）

## 4. 検証ゲート（全 PR 共通）

```bash
pnpm lint          # oxlint && eslint .
pnpm format:check  # oxfmt --check
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
```

- UI を含む PR：スマホビューポート（375px）での実表示確認を必須とし、**モックの同一画面と並べた2枚比較スクリーンショット**を添付する（モックに無い画面のみ単独可）。型が通っただけで完了と言わない（03 §8）
- migration を含む PR：`supabase db diff --linked` の無差分確認＋ `pnpm gen:types` 差分同梱
- M3 以降：`pnpm exec playwright test`（主要フロー）
- マージ順序が依存に従うこと（スキーマ変更 PR を最優先で処理）

## 5. リスクと手当て

| リスク | 手当て |
|---|---|
| oxfmt 0.x の挙動変化 | バージョン pin＋CI の `--check`。問題発生時は Prettier へ退避（03 §4） |
| Panda の静的解析制約（動的スタイル生成漏れ） | 色・状態分岐は variant 列挙で書く規約（03 §8）を T-02 でレビュー観点に組み込む |
| oxlint の Next 16 ルール網羅が不完全 | ESLint（eslint-config-next）併用で補完。完全移行は網羅率の再監査後 |
| 使用レポートフォームの複雑さ（モック最大） | T-32 を単独タスク化し、モックの状態管理コード（cropTabs 等）を仕様書として添付 |
| Grok 4.5 High Fast の出力単価（$18/M） | 画面量産タスクに限定して使う。長文の設計検討・調査は Opus 5／Sol 側に寄せる |
| 複数エージェントの並行競合 | worktree 分離＋タスクのファイル範囲を指示書で明示。スキーマ・共通 UI・トークン定義は「凍結ポイント」として先行マージ |
