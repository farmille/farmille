# 新エンジニア アクセス権 棚卸しチェックリスト

Farmille に参画するエンジニアが「ローカルで動かし、安全に本番へ反映できる」までに必要なアクセス権の一覧。
**着任初日にこの表を上から潰す**ことを想定している。

> 🔐 重要：本書には**キー・トークン・パスワード・個人連絡先などの値は一切書かない。**
> 値そのものの受け渡しは Slack / Google Doc（低機密）/ 1Password（高機密）で行う（ADR-0016。onboarding.md §5・§12）。

---

## 最小権限の考え方（ADR-0016: least-privilege dev）

- **既定は「frontend のみローカル起動」**。`API_URL` を共有 dev API（Cloud Run dev インスタンス）に向ければ
  **secret なしで動く**。新エンジニアに最初から prod/service_role を渡さない。
- **backend をフルローカル起動するときだけ** dev の `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET` を
  1Password 経由で受け取る。
- **prod の値は原則渡さない**（本番フリーズ運用。本番反映は当面 Ryoga / CTO が実施 or ペアで）。
- 機密度で経路を分離：**低機密 → Google Doc（本人限定）／高機密 → 1Password**。

---

## チェックリスト

| # | アクセス対象 | 最小権限の目安 | 付与する人 | 状態 |
|---|-------------|---------------|-----------|------|
| 1 | **GitHub repo**（`farmille/farmille` org） | Write（PR ベース運用、`main` 直 push 不可）。Admin は当面 CTO のみ | Ryoga（org owner） | [ ] |
| 2 | **Supabase（dev プロジェクト）** | dev のメンバー権限。anon key は公開前提（Google Doc）、service_role/JWT は backend フルローカル時のみ 1Password | Ryoga | [ ] |
| 3 | **Supabase（prod プロジェクト）** | 原則は閲覧/Studio 限定。書き込み・本番 migration は当面 CTO orペア。フル権限は段階付与 | Ryoga | [ ] |
| 4 | **Vercel**（frontend ホスティング） | プロジェクトメンバー。Production env 値は触らせず Preview から。GA/Sentry 値は env 管理 | Ryoga（過去に `ryoryoseine@gmail.com` 招待実績あり） | [ ] |
| 5 | **GCP（`farmille-production` プロジェクト / Cloud Run `farmille-api`）** | backend デプロイに必要な範囲（Cloud Run / Cloud Build / Secret Manager 参照）。Owner は最小限 | Ryoga（project Owner） | [ ] |
| 6 | **独自ドメイン / DNS**（`farmille.com`、お名前.com） | レジストラ操作はレジストラ権限保持者のみ。CLI 代行不可 | 根本さん（DNS 管理） | [ ] |
| 7 | **Sentry**（frontend / backend エラー監視） | プロジェクトメンバー（閲覧 + DSN）。`SENTRY_AUTH_TOKEN` は CI/CD secret 管理 | Ryoga | [ ] |
| 8 | **1Password**（高機密 secret 共有） | 該当 vault のメンバー（dev service_role / JWT 等） | Ryoga | [ ] |
| 9 | **Google Doc / Drive**（低機密：dev anon key・dev API URL） | 本人限定共有 | Ryoga | [ ] |
| 10 | **Slack（または連絡基盤）** | ステークホルダー導線（奥田/Ryosei/根本 への相談、デプロイ告知） | Ryoga | [ ] |
| 11 | **Notion 等のドキュメント基盤**（あれば） | 閲覧/編集。存在有無は要確認 | 要確認 | [ ] |

---

## 補足・注意

- **GCP の組織ポリシー依存（要確認）**：`iam.allowedPolicyMemberDomains`（Domain restricted sharing）により
  Cloud Run の一般公開（`allUsers`）が org 上位管理者の権限に依存する。project Owner だけでは公開設定を
  完結できない場合がある（上位管理者＝奥田さん等に Console 操作を依頼する運用）。
- **本番フリーズ中の権限付与は段階的に**：着任直後はローカル開発（frontend のみ）で動ける状態を最優先。
  本番（#3 / #5 / #6）のフル権限は、デプロイ手順（onboarding.md §7）を Ryoga と一度ペアで流してから付与する。
- **付与後の検証**：
  - [ ] `make setup && make dev` がローカルで起動（frontend のみ構成）
  - [ ] backend フルローカルが必要なら 1Password の dev secret で `uv run uvicorn app.main:app` 起動
  - [ ] GitHub に feature ブランチを push し、Vercel Preview が生成されることを確認
  - [ ] `gh pr list` / `gh pr create` が通る（GitHub CLI 認証済み）
- **値は絶対にコミットしない**：`.env*` は `.gitignore` 済。`git add -A` を避け ship ファイルのみ明示 stage
  （PII / 機密混入の地雷。onboarding.md §9-11）。
