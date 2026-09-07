# 新エンジニア アクセス権 棚卸しチェックリスト

Farmille に参画するエンジニアが「ローカルで動かし、安全に本番へ反映できる」までに必要なアクセス権の一覧。
**着任初日にこの表を上から潰す**ことを想定している。

> 🔐 重要：本書には**キー・トークン・パスワード・個人連絡先などの値は一切書かない。**
> 値そのものの受け渡しは Slack / Google Doc（低機密）/ 1Password（高機密）で行う（ADR-0016。onboarding.md §5・§12）。

---

## 最小権限の考え方（ADR-0016：least-privilege dev）

- **既定はリポジトリ直下のアプリとローカル Supabase を起動する**。開発用の公開キーとサーバー専用キーは `.env.local` に設定し、本番値は使わない。
- `SUPABASE_SECRET_KEY` は Next.js のサーバー処理だけで使い、ブラウザへ公開しない。共有が必要な場合は1Passwordを使う。
- **prod の値は原則渡さない**（本番フリーズ運用。本番反映は当面 Ryoga／CTO が実施するか、ペアで行う）。
- 機密度で経路を分離：**低機密 → Google Doc（本人限定）／高機密 → 1Password**。

---

## チェックリスト

| # | アクセス対象 | 最小権限の目安 | 付与する人 | 状態 |
|---|-------------|---------------|-----------|------|
| 1 | **GitHub repo**（`farmille/farmille` org） | Write（PR ベース運用、`main` 直 push 不可）。Admin は当面 CTO のみ | Ryoga（org owner） | [ ] |
| 2 | **Supabase（dev プロジェクト）** | dev のメンバー権限。公開キーは Google Doc、サーバー専用キーは1Passwordで共有 | Ryoga | [ ] |
| 3 | **Supabase（prod プロジェクト）** | 原則は閲覧/Studio 限定。書き込み・本番 migration は当面 CTO orペア。フル権限は段階付与 | Ryoga | [ ] |
| 4 | **Vercel**（Next.js アプリのホスティング） | プロジェクトメンバー。Production env 値は触らせず Preview から。GA/Sentry 値は env 管理 | Ryoga（過去に `ryoryoseine@gmail.com` 招待実績あり） | [ ] |
| 5 | **GCP（旧 `farmille-api` の撤去作業のみ）** | 原則として新規付与しない。T-53 の撤去担当者だけに必要最小限を付与 | Ryoga（project Owner） | [ ] |
| 6 | **独自ドメイン / DNS**（`farmille.com`、お名前.com） | レジストラ操作はレジストラ権限保持者のみ。CLI 代行不可 | 根本さん（DNS 管理） | [ ] |
| 7 | **Sentry**（アプリのエラー監視） | プロジェクトメンバー（閲覧 + DSN）。`SENTRY_AUTH_TOKEN` は CI/CD secret 管理 | Ryoga | [ ] |
| 8 | **1Password**（高機密 secret 共有） | 該当 vault のメンバー（dev service_role / JWT 等） | Ryoga | [ ] |
| 9 | **Google Doc / Drive**（低機密：dev anon key・dev API URL） | 本人限定共有 | Ryoga | [ ] |
| 10 | **Slack（または連絡基盤）** | ステークホルダー導線（奥田/Ryosei/根本 への相談、デプロイ告知） | Ryoga | [ ] |
| 11 | **Notion 等のドキュメント基盤**（あれば） | 閲覧/編集。存在有無は要確認 | 要確認 | [ ] |

---

## 補足・注意

- **GCP の組織ポリシー依存（要確認）**：`iam.allowedPolicyMemberDomains`（Domain restricted sharing）により
  Cloud Run の一般公開（`allUsers`）が org 上位管理者の権限に依存する。project Owner だけでは公開設定を
  完結できない場合がある（上位管理者＝奥田さん等に Console 操作を依頼する運用）。
- **本番フリーズ中の権限付与は段階的に**：着任直後はリポジトリ直下のアプリとローカル Supabase で開発できる状態を最優先。
  本番（#3 / #5 / #6）のフル権限は、デプロイ手順（onboarding.md §7）を Ryoga と一度ペアで流してから付与する。
- **付与後の検証**：
  - [ ] `npx supabase start` と `pnpm dev` でローカル起動
  - [ ] 画面表示と Next.js のサーバー処理がローカル Supabase に接続
  - [ ] GitHub に feature ブランチを push し、Vercel Preview が生成されることを確認
  - [ ] `gh pr list` / `gh pr create` が通る（GitHub CLI 認証済み）
- **値は絶対にコミットしない**：`.env*` は `.gitignore` 済。`git add -A` を避け ship ファイルのみ明示 stage
  （PII / 機密混入の地雷。onboarding.md §9-11）。
