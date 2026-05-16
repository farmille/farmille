# ADR-0009: メーカー承認フロー + アドミン画面導入

**Status**: Draft
**作成日**: 2026-05-13
**起草**: worker session（2026-05-06 定例 + 2026-05-13 worker 解像度づけ）
**決定者**: 酒井涼雅（CTO）
**関連**:
- ADR-0002（reviews insert role scope、二層ロール構造）
- ADR-0006（URL 名前空間 3 層分類）
- `docs/requirements/meeting-2026-05-06-maker-admin.md`（議事録）
- `docs/requirements/farmille-v1-functional-requirements.md` §2.1 §3.9
- `.claude/skills/farmille-architecture-principles/SKILL.md` §1.4

---

## 1. コンテキスト

2026-04-29 〜 2026-05-06 の 3 回の biz ミーティングで以下が確定した:

1. **メーカー登録は誰でも可能だが、運営事後確認で pending 状態で管理する**（2026-05-06）
2. **運営側の通報管理 / 記事公開 / 公式マーク付与は管理画面から行いたい**（2026-05-06）
3. **アドミンは付き合いある人にしかあげれない**（2026-05-13 worker）

これらは既存方針と複数衝突する:

- **SKILL §1.4 やらない表**「管理者画面 — SQL 直アクセスで代替」確定済みと衝突
- **機能要件 §2.1**「メーカー: サインアップで自己選択（v1 は承認なし）」と衝突
- **機能要件 §5.3.5**「メーカーアカウント承認フロー未確定」を解消する必要

worker session（2026-05-13）で実装側解像度を詰めた結果:

- pending = マーケット非公開（`/manufacturers` / `/products` に出ない、ログインは可能）
- アドミン画面 `/admin/*` を v1 必達、6 サブ画面（メーカー承認 / 通報管理 / 記事 CRUD / 公式マーク付与 / ロール管理 / 注目の資材）
- `role = 'admin'` を 6 ロール目として追加、`app_metadata.role` 二層構造に乗せる（ADR-0002 整合）
- 2FA 必須（Supabase Auth MFA）
- サインアップ経路なし、既存ユーザーを SQL or admin UI から手動昇格

## 2. 決定

### 2.1 メーカー承認フロー（pending → active）

- `users.status` enum を導入: `pending_review` / `active` / `frozen` / `rejected`
- メーカーがサインアップした直後は `pending_review` でマーケット非公開
- サインアップ時必須項目: 会社名 / 担当者名 / 連絡先メール（最小セット）
- アドミンが §3.9 B1 アドミン画面で承認 → `status = 'active'` 化
- 偽メーカー判定時は `status = 'frozen'` / `'rejected'` へ

### 2.2 アドミンロールの追加

- 既存 5 ロール（farmer / ja_staff / researcher / maker / unassigned）に **`admin` を 6 ロール目として追加**
- `app_metadata.role` と `public.users.role` の二層構造に乗せる（ADR-0002 整合）
- ロール変更は **`POST /v1/auth/register-role` API 経由のみ**（直 `UPDATE` 禁止、SKILL §4 アンチパターン #1 該当）
- アドミンのパブリックサインアップ経路は**作らない**。既存ユーザーを手動昇格のみ
- 初期昇格対象は共同創業者 3 名（Ryoga / 奥田 / 根本）

### 2.3 アドミン画面の構造

- URL: `/admin/*`（同一 frontend 内、Vercel デプロイ）
- 2FA 必須（Supabase Auth MFA）
- v1 サブ画面 6 個:
  - B1 メーカー承認
  - B2 通報管理
  - B3 記事 CRUD（note 風エディタ）
  - B4 公式マーク付与
  - B6 ユーザー・ロール管理
  - B7 注目の資材キュレーション
- v1 アウト: B5 課金状況閲覧 / B8 規約バージョン管理 / B9 お問い合わせ受信

### 2.4 SKILL §1.4 反転

- やらない表から「管理者画面 — SQL 直アクセスで代替」を**削除**
- やる表に 7. メーカーダッシュボード / 8. 講演会 / 9. アドミン画面 / 10. 静的ページを**追加**（10 画面構成へ拡張）

## 3. 採用した代替案

### A. 完全な「やらない」維持 + SQL 直運用（却下）
- 通報管理 / メーカー承認 / 記事公開 を SQL 直で運用するのは、月数十回の操作で運用負荷が高すぎる
- ヒューマンエラーリスク（誤って active メーカーを frozen にする等）が大きい
- biz が「管理画面から」と明確に発言しているのを覆す根拠が薄い

### B. Yelp Claim 方式 / 法人番号 API による自動審査（却下）
- 認証コストとリードタイムが大きすぎる
- v1 メーカー数 30 社想定で投資効果が低い
- v1.5 移行トリガを「メーカー数 50 社超 + 偽メーカー実害発生」とする

### C. 別サブドメイン / 別 Vercel プロジェクト（却下）
- v1 アドミン母数 3 名で運用、別環境にする運用コストが効果に見合わない
- `/admin/*` 同居でも 2FA + role check で十分（v1.5+ で必要時に分離検討）

### D. pending = 公開済 + 「未確認」バッジ表示（却下）
- SEO 効果はあるが、偽メーカー判定後に取り下げる作業頻度が増える
- 「マーケット非公開 a 案」のほうがリスク管理が単純

### E. v1 入り採用（採用）
- pending = マーケット非公開（a 案）
- アドミン画面で承認 / 通報 / 記事 / マーク付与 / ロール管理を一元化
- 2FA 必須で重操作のセキュリティ担保

## 4. 帰結

### Positive
- 運営運用の SQL 操作頻度が劇的に下がる（月数十回 → 月数回）
- ヒューマンエラーリスク低減
- メーカー承認の透明性向上（pending → active の状態遷移が明示的）
- 公式マーク付与の運営判断が記録される（運営判断メモ列）
- biz の方向性「協力ベース月3000円」「公式マーク」「pending 管理」「記事の便利な投稿」を実装可能に

### Negative
- v1 スコープが大幅拡大（6 画面 → 10 画面、4 新節 + 6 サブ画面）
- 2FA 導入で開発コスト追加
- `role = 'admin'` 追加で既存 ADR-0002 二層構造のテストケースが増える
- アドミン昇格ミスの組織リスク（信頼ベースで運用するため、運用ルールを内部 Notion で明示すべき）

### 中立
- 「将来的にアドミン UI を本格化する」という余地は残る（v1 は最小実装、v1.5+ で IP 制限 / 別サブドメイン / 監査ログ UI / 細粒度権限を検討）

## 5. 移行手順

1. migration: `users.status` enum 追加 + `users.role` enum に `admin` を追加 + 既存 active ユーザーの初期 status を `'active'` に backfill
2. backend: `POST /v1/auth/register-role` の admin 昇格対応 + `require_role('admin')` ミドルウェア追加
3. frontend: `/admin/*` ルーティング + 6 サブ画面の最小実装 + 2FA 設定 UI
4. 初期昇格: 共同創業者 3 名を手動で `admin` に昇格
5. 既存 maker アカウントの status を `'active'` に migration（v1 までに登録済みの maker は事後審査を別途行う）

## 6. 参考

- `docs/requirements/meeting-2026-05-06-maker-admin.md` 議事録
- `docs/requirements/feature-definition-workshop-maker-admin.md` §M5 §A1 §A2 §A3 §A4 §A5
- `docs/requirements/farmille-v1-functional-requirements.md` §2.1 §3.9 §5.3.5（解消）
- 食べログ owner 機能 / Yelp for Business / Stripe Dashboard（researcher 調査、workshop §M1 §A4）
