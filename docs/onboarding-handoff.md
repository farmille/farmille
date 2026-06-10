# Farmille 開発オンボーディング（引き継ぎ者向け）

軽微な **UX 改善・文言修正** を安全に進めるためのガイド。
まずこの 1 枚を読めばローカル開発〜PR まで回せるようにしてある。

> 運用モデルの背景・意思決定は [ADR-0016](decisions/0016-dev-handoff-operating-model.md)、
> Git の細部は [docs/git-workflow.md](git-workflow.md) を参照。

---

## 0. 結論（最初に押さえる 5 点）

1. **frontend だけローカルで動かす**。backend はローカルに立てない（共有 dev API を使う）。
2. **秘密情報は最小限**。`service_role` / `JWT secret` は渡されない・必要ない。
3. つなぐのは **dev 環境**（本番 Supabase / 本番 API には触れない）。
4. **`main` に直接 push しない**。作業ブランチ → PR → Vercel Preview で確認 → レビュー。
5. いまは **本番フリーズ中**。PR は作って良いが **merge は CTO が保留**する（承認まではOK）。

---

## 1. 全体像（dev と prod の分離）

| 層 | dev（あなたが触る） | prod（触らない） |
|---|---|---|
| Supabase | `chgrudbattvmcjxhaskh` | `sajxnypkbybuzsqdguaa` |
| Backend | Cloud Run `farmille-api-dev`（共有） | Cloud Run `farmille-api`（手動デプロイ） |
| Frontend | ローカル `localhost:3000` / Vercel Preview | Vercel 本番（`farmille.com`） |

- frontend は **BFF 原則**で Supabase を直接叩かない。データは必ず backend(`API_URL`/FastAPI)経由で取得する。
- そのため frontend をローカルで動かすには **到達可能な backend が必要** → 共有 dev API(`API_URL`)に向ける。
- `API_URL` は frontend の**サーバー側だけ**で使われる（ブラウザには出ない）。だから秘密でもなく、CORS も気にしなくてよい。

---

## 2. 必要なもの

- Node.js 22+ / pnpm 10+
- Git, GitHub アカウント（リポジトリへの招待を CTO に依頼）
- **1Password の共有 Vault へのアクセス**（dev 用の値はここから取得。Slack や平文では渡さない）

> backend を動かす場合に必要な Python / uv / Docker は、文言・UX 修正では**不要**。

---

## 3. セットアップ（frontend のみ）

```bash
# 1. クローン
git clone https://github.com/farmille/farmille.git
cd farmille

# 2. frontend の env を用意
cp frontend/.env.example frontend/.env.local
#    → frontend/.env.local を 1Password「farmille-dev / frontend」の値で埋める（§4）

# 3. 依存インストール & 起動（frontend だけ）
cd frontend
pnpm install
pnpm dev          # http://localhost:3000
```

`make dev`（リポジトリ直下）は **backend も起動しようとする**ので、frontend のみで進める場合は
上記の `pnpm dev` を使う。

### 動作確認
- `http://localhost:3000` を開く。トップ・製品一覧などデータ系ページが表示されれば、
  共有 dev API への接続まで通っている。
- データ系ページで `API_URL not configured` / fetch エラーが出る場合は §7 を参照。

---

## 4. 環境変数（`frontend/.env.local`）

実値は **1Password 共有 Vault** から取得して埋める。リポジトリにはコミットしない（`.gitignore` 済）。

| 変数 | 値（dev） | 備考 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://chgrudbattvmcjxhaskh.supabase.co` | dev プロジェクト |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | （Vault から） | anon key は公開前提・RLS で保護。秘密ではない |
| `API_URL` | （Vault：共有 dev API の URL） | 例 `https://farmille-api-dev-xxxx.a.run.app`。**サーバー側専用** |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | メールリンク等の戻り先 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 空でよい | ローカルは計測しない |
| `NEXT_PUBLIC_SENTRY_DSN` | 空でよい | 空なら Sentry init をスキップ |

> **渡されない＝必要ない**もの: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`。
> これらは dev backend（Cloud Run）内にのみ存在する。あなたのローカルには置かない。

---

## 5. 日々の開発フロー

```bash
# 1. 最新 main から作業ブランチを切る（main では作業しない）
git switch main
git pull --ff-only origin main
git switch -c fix/products-copy-typo     # プレフィックス必須（feat/fix/docs/chore/refactor）

# 2. 修正 → コミット（Conventional Commits。subject は英語・命令形）
git add -p
git commit -m "fix: correct product subtitle wording"

# 3. push して PR を作成
git push -u origin fix/products-copy-typo
gh pr create --web        # または GitHub の Web で作成
```

4. PR に自動で付く **Vercel Preview URL** で実画面を確認する（Preview は dev API に接続）。
5. CI（frontend の lint / 型 / test）が緑になっていることを確認する。
6. **レビュー依頼** → approve。
7. **フリーズ中は merge しない**（CTO がフリーズ解除後にまとめて merge）。

### ブランチ名 / コミット種別
`feat/` 新機能, `fix/` バグ修正, `docs/` ドキュメント, `chore/` 設定・依存, `refactor/` 挙動不変。
詳細は [docs/git-workflow.md](git-workflow.md)。

---

## 6. 触ってよい / 触らない

### ✅ 触ってよい（軽微 UX・文言）
- frontend の表示文言・microcopy・ボタン/見出しのテキスト
- Tailwind のスタイル調整（**`docs/design-tokens.md` の禁止事項を守る**）
- 静的ページ・マーケ文言

### ⛔ 触らない（変更は要 ADR / CTO レビュー。CODEOWNERS で必須レビュー設定済）
- `supabase/migrations/**`, `*.sql`（DB スキーマ・RLS）
- `backend/app/**`（認証・レビュー投稿・検索などサーバー側ロジック）
- `backend/*.sh`（deploy / gcp スクリプト）, `frontend`・`backend` の `.env.example`
- `docs/decisions/**`（ADR は提案ベース。勝手に書き換えない）
- `.github/**`（CI / PR テンプレ / CODEOWNERS）
- frontend の **検索ロジック・認証まわり**（`src/**/auth/**` 等）

### 鉄則
- frontend から **`supabase.from(...)` / `supabase.rpc(...)` を書かない**（BFF 原則）。
  データ取得は必ず backend(`API_URL`)経由。auth/storage の SDK 利用は別途許容。
- 迷ったら **CTO に確認**。`main` を壊しそうな不安があれば実行しない（[git-workflow §9](git-workflow.md)）。

---

## 7. トラブルシューティング

| 症状 | 対処 |
|---|---|
| データ系ページで `API_URL not configured` | `frontend/.env.local` の `API_URL` が空。1Password の共有 dev API URL を設定し再起動 |
| データは出ないが画面枠は出る | 共有 dev API が一時停止/未構築の可能性。CTO に dev API（`farmille-api-dev`）の稼働を確認 |
| 型エラー（`Database` 型が古い） | DB 変更を含む作業はそもそも対象外。発生したら CTO に連携（`pnpm gen:types` は CTO 側で実行） |
| 認証メールが届かない | dev は確認スキップ設定（`SIGNUP_REQUIRE_EMAIL_CONFIRM=false`）。届かない前提で進めてよい |
| `pnpm dev` が 3000 を掴んだまま | `lsof -ti:3000 \| xargs kill -9`（または `make stop`） |

---

## 8. CTO 側の前提作業（引き継ぎ者は読むだけでよい）

この運用を成立させるために、CTO が一度だけ行う作業:

1. **共有 dev バックエンドの構築**: `bash backend/deploy-dev.sh`
   （Cloud Run `farmille-api-dev`、dev Supabase 参照、`min-instances 0`）。
   発行された URL を 1Password と本 doc §4 に記載。
2. **dev 用 `frontend/.env.local` の値一式**を引き継ぎ者へ共有する。
   テンプレートは [docs/handoff-credentials-template.md](handoff-credentials-template.md)。
   本人だけに限定共有した Google Doc にコピーして埋める（高機密が無いため可）か、1Password 共有 Vault を使う。
3. **GitHub**: リポジトリへ招待、`main` のブランチ保護を有効化（PR 必須 / frontend status check 必須 /
   Code Owner レビュー必須 / 会話解決必須）。CTO 単独運用の間は **administrators バイパスのみ許可**
   （自分の sensitive PR を merge できるように。reviewer 増員後に禁止）。"Automatically delete head branches" を ON。
4. **Vercel**: Preview スコープの env `API_URL` を **dev API** に設定（本番スコープは本番 API のまま）。
   これで Preview デプロイが dev に向き、本番データに触れない。
5. **フリーズ運用**: フリーズ中は merge を保留。解除後にまとめて merge。
