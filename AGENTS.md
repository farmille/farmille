# Farmille プロジェクト方針

## このプロジェクトについて

BS資材（生物・微生物農業資材）の農家レビュープラットフォーム。2026-07-26 からアプリを全面的に作り直している（後方互換は持たない）。

**設計の正は [`docs/rebuild/`](docs/rebuild/00-overview.md)。** 実装判断は必ずここを参照する。旧実装向けのドキュメント（specs・ADR・旧 architecture.md 等）は削除済みで、リポジトリ内に別系統の「正」は存在しない。

| 分冊 | 内容 |
|---|---|
| [00-overview.md](docs/rebuild/00-overview.md) | 全体像・スコープ・確定済みの意思決定（D1〜D14） |
| [01-domain-model.md](docs/rebuild/01-domain-model.md) | ドメインモデル・ER 図・テーブル定義・RLS・認証設計 |
| [02-screens.md](docs/rebuild/02-screens.md) | 画面一覧・画面遷移・デザイントークン |
| [03-architecture.md](docs/rebuild/03-architecture.md) | 技術構成・構造規約・実装規約 |
| [04-implementation-plan.md](docs/rebuild/04-implementation-plan.md) | マイルストーン・タスク分割・委譲の実務 |
| [05-cleanup.md](docs/rebuild/05-cleanup.md) | 旧リポジトリの削除・移設・残存リスト |

入力資料の写しは `docs/rebuild/reference/`（要件定義 v1・OOUI 抽出・スマホ版モックアップ19画面）、タスク指示書は `docs/rebuild/tasks/T-xx.md`。

## 技術スタック

- アプリ本体：**Next.js 16**（App Router・Turbopack）／TypeScript／**Panda CSS**／**Vercel**。画面もサーバー処理も1スタックに集約する
- DB・Auth・Storage：**Supabase**（PostgreSQL。同一プロジェクトを継続し、スキーマは v2 として全面刷新）
- 監視：Sentry ＋ GA4
- 品質ゲート：oxlint（主）＋ ESLint（補完）／oxfmt／tsc／Vitest／Playwright（M3 以降）／GitHub Actions
- **廃止**：旧 Python バックエンドと Cloud Run、Tailwind CSS（`docs/rebuild/03-architecture.md` §1・§3）

## 設計哲学（最重要）

**DOA（Data-Oriented Architecture）を最優先する。**

- データモデルは技術負債を一切作らない。第3正規形を守り、JSONB 濫用で正規化を逃げない
- UI は作り直せるが DB は不可逆。破壊的 ALTER より「新テーブル＋データ移行＋旧削除」
- UI もデータ層と同じ品質基準で作る（型安全・fail fast・トークン経由・実画面での検証）。データ設計の決定を覆す UI は作らない

## アカウント体系（2アカウント制）

旧実装の職業別ロール制は廃止した。「何者か」はプロフィール属性で表現し、権限とは分離する。詳細は `docs/rebuild/01-domain-model.md`。

- **一般ユーザー**：匿名・ハンドルネーム。レビュー／使用レポートの投稿・参考になった・検討リストへの保存。`profiles`（`auth.users` と 1:1）
- **出品者**：実名・法人。共有 ID でログインし、自社資材の claim・一次情報編集・エビデンス管理・分類変更申請・記事投稿。`seller_accounts` が申請〜審査〜運用を status で管理
- **運営（admin）**：AAL2（2要素）必須。出品者審査・資材登録／claim 承認・タグ管理・通報処理・使用レポート編集局
- 非ログインでも全コンテンツを閲覧できる。投稿・参考になった・保存だけが要ログイン（D6）
- 資材の所有権は2層に分かれる：一次情報層（出品者が編集）と分類・検索層（Farmille 所有）

## 実装規約

正は `docs/rebuild/03-architecture.md` §8（要約）。

- **型**：`any` を書かない。DB・API の戻り値は `database.types.ts` から派生させ、ページごとに手書きの重複型を作らない
- **スタイル**：色・余白・角丸・タイポの生値をコンポーネントに直書きしない。すべて Panda のトークン経由。条件分岐は recipe の variant として列挙し、実行時に決まる動的値をスタイルへ渡さない
- **状態とデータ取得**：取得は Server Components、変更は Server Actions か Route Handlers に寄せる。クライアント側の状態は入力フォームとトグルに限る
- **fail fast**：環境変数・必須パラメータが無い場合はフォールバックせずエラーにする。`?? "http://localhost:3000"` のような既定値を書かない
- **エラー表示**：例外を握り潰さない。404・403・500 をユーザーに意味の伝わる日本語で出し分ける（`error.tsx`・`not-found.tsx` を必ず置く）
- **完了の定義**：型チェックと lint が通っただけでは完了としない。**375px の実画面で対象フローを操作し、スクリーンショットを添えて初めて完了**
- **共通化**：同じ UI パターンを3回書く前に共通コンポーネント化する。ページ内に長大なインライン JSX と業務ロジックを同居させない
- **ファイル名**：独自コンポーネントの `.tsx` ファイル名は PascalCase にする（例：`ProfileEditForm.tsx`）。Storybook は `ProfileEditForm.stories.tsx` とする。`page.tsx`・`layout.tsx`・`error.tsx`・`not-found.tsx` など、App Router の予約ファイルだけは小文字のままにする

構造規約（同 §2・§6）：

- `src/server/` がドメインロジックと Supabase アクセスの唯一の置き場。`SUPABASE_SECRET_KEY` はここからのみ参照する
- UI・クライアントコンポーネントから `supabase.from()` を直接呼ばない（`auth.*`／`storage.*` のクライアント利用のみ可）
- Route Handlers（`src/app/api/`）はフォーム POST・Webhook・外部から叩かれるものだけに絞る。画面内の読み取りは Server Components から `src/server/` を直接呼ぶ
- 環境変数は `src/env.ts` の1箇所で起動時に検証する。ホスティング固有の環境変数をコードで参照しない（ポータビリティ予算）
- エラーレスポンスは `{ok: false, error: "<code>"}` に統一（D9）。エラーコード → 日本語文言の辞書は1箇所に置く
- migration は適用済みファイルの編集禁止・修正は常に新規ファイル。リリース前に `supabase db diff --linked` で無差分を確認する

## 型生成（`pnpm gen:types`）

Supabase の DB スキーマから TypeScript 型定義（`src/types/database.types.ts`）を再生成するコマンド。

**実行タイミング**：

- migration を dev プロジェクトへ適用した直後
- マスタデータの seed が変わった直後
- カラム追加／削除／型変更を伴う ALTER の直後

**未実行で起こる症状**：`Database` 型が古いままで、新カラムへのアクセスが `any` 落ちか型エラーになる。`tsc --noEmit` が通っても実体と型が乖離する。

migration を含む PR には必ず `pnpm gen:types` の差分を含める。

## 検証コマンド

```bash
pnpm lint && pnpm format:check && pnpm exec tsc --noEmit && pnpm exec vitest run && pnpm build
```

これが緑になっても完了ではない（実装規約の「完了の定義」を参照）。

## 依存セキュリティ監査

着手時・PR 作成時に実行する。

```bash
pnpm audit --audit-level=high                  # high 以上の既知脆弱性を抽出
pnpm audit --json | jq '.advisories'           # 詳細を JSON で
pnpm outdated                                   # major upgrade 候補の把握
```

**判定基準**：

- `critical` / `high` が出たら **PR ブロック**（hotfix で先に塞ぐか、別 PR で固定）
- `moderate` 以下は起票して次 sprint で対応
- 直接依存（direct）が原因の脆弱性は最優先、推移依存（transitive）は upstream 修正待ちでも可

**手動 grep 監査（補助）**：

```bash
# サーバー専用の値がクライアント側へ漏れていないか（定義元の src/env.ts と src/server 以外は 0 件）
grep -rn "SUPABASE_SECRET_KEY\|SERVICE_KEY\|JWT_SECRET" src --exclude-dir=server --exclude=env.ts

# 二層防御の原則違反（0 件。auth.* / storage.* は許容）
grep -rn "supabase\.\(from\|rpc\)(" src --exclude-dir=server
```

`npm audit` は使わない（pnpm に揃える）。月次で `gh dependabot alerts list` を確認する。CI（GitHub Actions）では lint・format・typecheck・test・build を回す。

## ディレクトリ規約

`docs/rebuild/03-architecture.md` §7 の目標形。

- リポジトリ直下：Next.js 16 の設定・依存関係・実行コマンド
- `src/app/`：ルーティングと画面
- `src/server/`：ドメインロジック・Supabase アクセス
- `src/components/`：共通 UI（Panda recipes）。`styled-system/` は gitignore し CI で codegen
- `supabase/migrations/`：v2 系 migration のみ（`config.toml` も併せてコミットする）
- `tools/migration/`：資材マスタ移行スクリプト。`legacy/` は旧実装の参照実装と退避した旧 migration で、移行検証の完了後に T-53 でまとめて削除する
- `docs/rebuild/`：設計の正（`reference/` に入力資料、`tasks/` にタスク指示書）
- `docs/ops/`：運用記録（`security-notes.md`・`access-checklist.md`）
- `docs/email-templates/`：Supabase Auth のメールテンプレート（スキーマ非依存で v2 でも使う）
- `.github/workflows/`：CI

## 質問すべき条件（迷ったら止まる）

`docs/rebuild/04-implementation-plan.md` §1 の原則。

- 実装中に設計との矛盾・不明点が出たら、コードで勝手に解釈せずタスク指示書の「質問すべき条件」に従って**止まる**
- `docs/rebuild/00-overview.md` §4 の確定事項（D1〜D14）から**逸脱する必要が出た時点で作業を止める**。変更する場合は 00-overview.md を先に改訂する
- 1タスク＝1ブランチ＝1 worktree＝1エージェント。同一ファイルを触るタスクを並行させない
- スキーマ変更を伴うタスクは必ず単独 PR に分離する
- 完了報告は「変更点・実行した検証（成功／失敗／skip）・未確認事項」の3点セット。検証を通していないものを完了と呼ばない

## トラブルシューティング

- **型エラーが出る** … migration 適用後に `pnpm gen:types` を流したか確認する。解消しない場合は migration ファイル自体を確認する
- **Panda のスタイルが効かない** … `panda.config.ts` を変更したら codegen の手動再実行が必要（CI は codegen → tsc の順）。動的値をスタイルへ渡していると静的解析で生成漏れになる
- **環境変数が無いと言われる** … `src/env.ts` は意図的に fail fast。既定値で逃げず `.env.local` に値を入れる
- **lint の指摘が二重に出る** … oxlint と ESLint の役割分担（`eslint-plugin-oxlint` で oxlint 実装済みルールを off）を確認する

## 運用上の申し送り

2026-07-04 の secret 誤アップロード事故を受けた **service_role キーと JWT secret のローテーションが未実施**。記録は `docs/ops/security-notes.md`、手順概要は `docs/rebuild/03-architecture.md` §6。新アプリは最初から新 API キーで構築する。
