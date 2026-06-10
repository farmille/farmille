# 引き継ぎ者への認証情報・env 受け渡しテンプレート

このファイルは **プレースホルダのみ**（実値ゼロ）。コミット安全。
**実値を埋めた版は「その人だけに共有した Google Doc（または 1Password）」にだけ置き、リポジトリに絶対コミットしない。**

> 運用の背景は [ADR-0016](decisions/0016-dev-handoff-operating-model.md) / [onboarding-handoff.md](onboarding-handoff.md)。

---

## 0. 最初に：機密度で受け渡し経路を分ける

- **frontend の値（低機密）→ 本人限定共有の Google Doc**。引き継ぎ者は既定で frontend のみ起動し、
  データは共有 dev API 経由（`API_URL` は frontend のサーバー側専用でブラウザに出ない）。
  - `NEXT_PUBLIC_SUPABASE_URL`（非機密）
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`（**公開前提**の鍵・ブラウザに必ず出る・RLS が保護・低機密）
  - `API_URL`（共有 dev Cloud Run の URL・非機密・`backend/deploy-dev.sh` 実行後に確定）
  - 残りは空 or 固定値
- **backend の値（高機密）→ 1Password のみ**。backend をローカルで動かす場合だけ渡す（§1b）。
  - `SUPABASE_SERVICE_ROLE_KEY`（**RLS を全バイパス**）/ `SUPABASE_JWT_SECRET`（トークン偽造可）。
  - **dev サンドボックス限定**。**Google Doc には絶対に載せない。**
- **prod（`sajxnypkbybuzsqdguaa`）の値は一切渡さない。**

---

## 1. frontend/.env.local に入れる値（これを Google Doc に転記して埋める）

| 変数 | 値 | 機密度 | 取得元 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://chgrudbattvmcjxhaskh.supabase.co` | 非機密 | 固定（dev プロジェクト） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<DEV_ANON_KEY を貼る>` | 低（公開前提） | Supabase dev → Project Settings → API → `anon public` |
| `API_URL` | `<DEV_API_URL を貼る>` 例 `https://farmille-api-dev-xxxx.a.run.app` | 非機密 | `deploy-dev.sh` 実行後の出力 URL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | 非機密 | 固定 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | （空） | — | ローカルは未計測 |
| `NEXT_PUBLIC_SENTRY_DSN` | （空） | — | 空なら init スキップ |

### コピペ用ブロック（Google Doc に貼って `< >` を置換）

```dotenv
# frontend/.env.local — dev 専用。リポジトリにコミットしない（.gitignore 済）
NEXT_PUBLIC_SUPABASE_URL=https://chgrudbattvmcjxhaskh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<DEV_ANON_KEY>
API_URL=<DEV_API_URL e.g. https://farmille-api-dev-xxxx.a.run.app>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 1b. backend/.env（dev・フルローカル時のみ・1Password 経由）

backend をローカルで動かす場合だけ。`service_role` / `JWT secret` は **1Password から受領**し、
**この Doc / Google Doc には絶対に載せない**。残りは `.env.example` の dev 既定でよい。

| 変数 | 値 | 機密度 | 取得元 |
|---|---|---|---|
| `SUPABASE_URL` | `https://chgrudbattvmcjxhaskh.supabase.co` | 非機密 | 固定（dev） |
| `SUPABASE_SERVICE_ROLE_KEY` | `<1Password から>` | **高（RLS 全バイパス）** | 1Password「farmille-dev / backend」 |
| `SUPABASE_JWT_SECRET` | `<1Password から>` | **高（トークン偽造）** | 1Password「farmille-dev / backend」 |
| `CORS_ORIGINS` | `http://localhost:3000` | 非機密 | 固定 |
| `ENVIRONMENT` | `development` | 非機密 | 固定 |
| `SIGNUP_REQUIRE_EMAIL_CONFIRM` | `false` | 非機密 | dev 既定 |
| `FARMILLE_MAKER_USER_ID` | `46e7a39a-a1a4-4e3c-ba30-2d3f77bcf233` | 低（dev house account の id） | 固定（dev） |
| `SENTRY_DSN` | （空でよい） | — | ローカルは未送信 |

> ローカル backend を使う時は `frontend/.env.local` の `API_URL=http://localhost:8000` に変更する。
> ⚠ `service_role` / `JWT secret` は **dev 限定**の強い鍵。`backend/.env` はコミット禁止（`.gitignore` 済）・
> 他所に転記しない。**prod の値は受け取らない・要求しない**。

---

## 2. アカウント・アクセス権の付与（Doc にチェックリストとして）

| 対象 | 付与内容 | 方法 | 必須？ |
|---|---|---|---|
| GitHub | `farmille/farmille` への招待（Write、main は保護済） | リポジトリ Settings → Collaborators | 必須 |
| 共有 dev API | `API_URL` の URL を伝えるだけ | この Doc の §1 | 必須 |
| Supabase dev ダッシュボード | （任意）テーブル確認用に閲覧権 | Supabase org → Members（dev プロジェクトのみ） | 任意 |
| Vercel | （任意）自分の Preview を見たい場合のみ | Vercel Team へ招待 | 任意 |
| 1Password | dev backend secret（service_role / JWT）の共有 Vault | Vault 共有 | フルローカル時 必須 |

> Supabase は **dev プロジェクト（`chgrudbattvmcjxhaskh`）のみ**。prod（`sajxnypkbybuzsqdguaa`）には招待しない。

---

## 3. 受け渡し後チェック（引き継ぎ者と一緒に）

- [ ] `cp frontend/.env.example frontend/.env.local` → 上記値で埋めた
- [ ] `cd frontend && pnpm install && pnpm dev` でトップ・製品一覧が表示される（= 共有 dev API 接続OK）
- [ ] GitHub で作業ブランチを push → PR → Vercel Preview が出る
- [ ] 「触らない一覧」（onboarding §6）を読了

---

## 4. この Doc 自体の共有ルール（重要）

- **共有先はその人 1 名のみ**。「リンクを知っている全員」は使わない。
- 権限は **閲覧者（Viewer）** で十分（編集させない）。
- ダウンロード/印刷/コピーを無効化（Doc の共有設定 → 詳細）。
- 退任時はこの Doc の共有を解除。**anon key を本当にローテートしたい場合**は Supabase dev の
  API キー再発行 → Vercel/ローカルの値も更新（anon は公開前提なので必須ではない）。
- 高機密（service_role/JWT/prod）はこの Doc に **絶対に書かない**。必要時は 1Password で個別共有。
