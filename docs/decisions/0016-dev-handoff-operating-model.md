# ADR-0016: 開発引き継ぎ運用モデル（最小権限 dev アクセス + 本番フリーズ + CI 導入）

**ステータス**: Accepted
**決定日**: 2026-06-10
**決定者**: 酒井涼雅（CTO）
**関連**: [ADR-0013](0013-gcp-cloud-run-migration.md)（Cloud Run / dev・prod 分離）, [docs/git-workflow.md](../git-workflow.md), [docs/onboarding-handoff.md](../onboarding-handoff.md)

## コンテキスト

v1 本番公開済み（2026-06-01）。今後、**軽微な UX 改善・文言修正**を担う引き継ぎ開発者が
ローカル開発に参加する。一方で:

- DB・認証・レビュー投稿・検索ロジックは DOA 上の中核であり、不用意な変更は技術負債に直結する。
- **現時点では本番環境に更新を出せない**（リリースゲートを別途調整中）。にもかかわらず、
  `main` への merge は Vercel 経由でフロントを**即本番デプロイ**する（事故導線）。
- 引き継ぎ者に本番／dev の秘密情報をどこまで渡すかが未定義（最小権限の線引きが無い）。
- 既存 `docs/git-workflow.md` はブランチ保護・PR テンプレを「チーム化時に有効化」と
  **保留**したままで、`.github/` 実体（CODEOWNERS / PR テンプレ / CI）が存在しない。

「ルールを厳格にしつつ運用しやすく」を両立する運用モデルをここで確定する。

## 決定

### 1. 最小権限の dev アクセス（フロントのみ・secret を渡さない）
- 引き継ぎ者は **frontend のみローカル起動**し、`API_URL` を**共有 dev バックエンド**に向ける。
- `API_URL` は frontend で**サーバー側専用**（Server Components / Route Handler proxy、`NEXT_PUBLIC_` 無し）
  に使われ、ブラウザに露出しない。よってブラウザ→FastAPI 直叩きは存在せず、引き継ぎ者に
  **`SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET` を渡さない**。これらは dev バックエンド
  （Cloud Run）内にのみ存在する。
- 引き継ぎ者が持つのは dev の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  （anon key は公開前提・RLS で保護）/ dev `API_URL` のみ。
- 共有 dev バックエンドは **Cloud Run `farmille-api-dev`**（`backend/deploy-dev.sh`、dev Supabase
  `chgrudbattvmcjxhaskh` を参照、`min-instances 0`）として CTO が一度立てる前提作業とする。

### 2. 本番フリーズ = プロセス凍結（merge 保留）
- フリーズ期間中、PR の**レビュー・approve までは通常通り**行うが、**`main` への merge を保留**する。
- 本番デプロイ導線の実態を前提に運用する:
  - **frontend**: Vercel が `main` → 本番自動デプロイ。`feat/*` 等は Preview。→ **merge しない限り本番に出ない**。
  - **backend**: Cloud Run へ `backend/deploy-prod.sh` で**手動**デプロイ（`main` push では自動デプロイされない）。`railway.toml` は ADR-0013 で退役済。
- したがって本番更新の唯一の自動導線は「`main` への merge（Vercel）」であり、これを**人手のゲート**で止める。
  追加のインフラ変更（Vercel デプロイ停止 / staging ブランチ）は採らない（最小・可逆を優先）。

### 3. CI 導入（段階導入）と構造的ガード
- `.github/` を実体化する:
  - `PULL_REQUEST_TEMPLATE.md`（動作確認・フリーズ・DB 影響のチェックリスト）
  - `CODEOWNERS`（後述の sensitive パスに CTO レビュー必須）
  - `workflows/ci.yml`（frontend + 依存 audit）/ `workflows/ci-backend.yml`（backend、path-filter）
- CI は 2 ワークフロー:
  - **frontend（全 PR・blocking・現状 green）**: `pnpm lint` / `tsc --noEmit` / `vitest run`。
    全 PR で必ず走らせる（required check が「実行されず merge 不能」になる罠を回避）。
  - **backend（`backend/**` 変更時のみ・advisory・現状赤）**: `ruff check app` / `pytest`。`main` に
    既存の腐敗（ruff 7件 / test fixture drift 26件、いずれも製品バグではない）があるため当面 `continue-on-error`。
  - **依存 audit（advisory）**: `pnpm audit --audit-level=high` / `pip-audit`。
- `main` のブランチ保護を**有効化**（PR 必須 / frontend status check 必須 / Code Owner レビュー必須 /
  会話解決必須）。CTO 単独運用の間は administrators バイパスのみ許可（CTO が自分の sensitive PR を
  merge できるようにするため。新規 dev は非管理者なので PR・承認・CODEOWNERS で完全にゲートされる）。
  reviewer 増員後にバイパス禁止へ。

### 4. 触ってよい / 触らない 境界（CODEOWNERS で構造強制）
- **触らない（CODEOWNERS 必須レビュー）**: `supabase/migrations/**`, `*.sql`, `backend/app/**`,
  `backend/*.sh`（deploy/gcp）, `backend/.env.example`, `frontend/.env.example`, `docs/decisions/**`,
  `.github/**`, `frontend/src/**/auth/**`, 検索・レビュー投稿のサーバー側ロジック。
- **触ってよい**: frontend の文言・microcopy・Tailwind スタイル（`docs/design-tokens.md` 準拠）・
  静的ページ。ただし BFF 原則（frontend から `supabase.from/rpc` 禁止）を維持する。

## 理由
1. `API_URL` がサーバー側専用である事実により、秘密情報ゼロでも引き継ぎ者の作業は完結する
   （ブラウザ CORS も不要）。blast radius を最小化できる。
2. backend が手動デプロイである以上、本番自動導線は Vercel(`main`) のみ。merge 保留という
   最小の人手ゲートで「本番に出さない」を完全に担保でき、可逆。
3. frontend が既に green であるため、引き継ぎ者の典型 PR（文言）は blocking CI を**通過**する。
   赤い backend を required にすると全 PR がブロックされ「運用しやすく」に反するため段階導入とする。
4. CODEOWNERS により「触らない」を信頼でなく**構造**で強制でき、「厳格」を満たす。

## 既知のリスクと対策
| リスク | 対策 |
|---|---|
| フリーズ中に誤って `main` merge | ブランチ保護 + PR テンプレに「フリーズ中: merge 保留」明記。merge 権限は CTO に限定 |
| 共有 dev バックエンド未構築だとフロントのデータ系ページが描画不可（BFF 原則で直叩き不可） | `backend/deploy-dev.sh` を CTO が一度実行し、URL を 1Password と onboarding doc に記載 |
| backend CI が advisory のまま放置され腐敗が蓄積 | 別 PR で ruff 7件 + test drift 26件を解消し、`continue-on-error` を外して required へ昇格 |
| anon key 流出懸念 | anon key は公開前提（RLS が第二防御）。service_role / JWT secret のみ厳格管理 |
| 秘密情報の受け渡し経路の散逸 | 受け渡しは **1Password 共有 Vault** に一本化。Slack/平文での共有禁止 |

## 次回見直しタイミング
- 本番フリーズ解除時（リリースゲート確定時）に「2. プロセス凍結」を解除し、merge 運用へ戻す。
- backend の腐敗解消 PR 完了時に「3. backend job を required へ昇格」を再評価。
- チーム人数が CTO 1 名のレビューで詰まる規模に増えた段階で CODEOWNERS の owner を追加。
