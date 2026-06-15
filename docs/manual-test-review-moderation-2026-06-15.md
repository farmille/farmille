# 手動テスト計画 — レビュー承認 / マイページ / ログイン修正 ほか (2026-06-15)

対象リリース：PR #39（`feat(reviews): pre-moderation approval flow + account settings + login fix`、main `9eb1c70`）
＋ 同セッションの追加変更（ファビコン、ヘッダー検索ボタン削除）

> **重要**：レビュー承認機能は DB 新カラム `reviews.status` に依存します。テストする環境の DB に
> migration を**先に適用**しないと、全製品ページのレビュー取得が 500 になります。
> **本番ではなく dev でテスト**してください（本番反映の手順は末尾「本番デプロイ前ゲート」参照）。

---

## 0. 事前準備（テスト環境 = dev）

- [ ] dev に migration 適用：`supabase db push --linked`（`20260613000000_reviews_moderation_status.sql`。既存レビューは自動で `status='approved'` に backfill される）
- [ ] PostgREST にスキーマ反映：dev で `NOTIFY pgrst, 'reload schema';`
- [ ] 型再生成：`cd frontend && pnpm gen:types`（`database.types.ts` に status 等が入る）
- [ ] backend 起動（dev 向け） / `cd frontend && pnpm dev` でフロント起動
- [ ] テスト用アカウントを用意：**farmer**（または researcher/ja_staff）1つ、**admin**（MFA 登録済み）1つ

---

## A. ログイン / 戻り先(next) + セキュリティ（open-redirect 修正）

- [ ] 未ログインで `/me/reviews` を開く → `/login?next=/me/reviews` に遷移 → ログイン → **`/me/reviews` に戻る**
- [ ] 製品ページの「ログインしてレビューを投稿する」→ ログイン後に**その製品ページへ戻る**
- [ ] 通常ログイン（next なし）→ ロール別ホーム（farmer は `/products`、admin は MFA 経由で `/admin`）に着地
- [ ] **【セキュリティ】** `/login?next=%2F%09%2Fevil.com` を開いてログイン → **evil.com に飛ばず**、自分のホームに着地（タブ文字バイパス封じ）
- [ ] **【セキュリティ】** `/login?next=//evil.com` → 同様に外部に飛ばない
- [ ] **【セキュリティ】** admin で `/login?next=%2F%09%2Fevil.com` → MFA を経ても evil.com に飛ばない
- [ ] admin で `/login?next=/admin/reviews` → MFA 経由で最終的に **`/admin/reviews`** に着地
- [ ] 期待結果すべて：外部ドメインへのリダイレクトが**一度も発生しない**

## B. レビュー投稿 → 承認待ち → 公開（本命フロー）

- [ ] farmer でログインし、製品ページからレビュー投稿 → **「レビューを投稿しました（承認後に公開）」パネル**が表示
- [ ] その製品ページのレビュー一覧に**まだ表示されない**（pending は非公開）
- [ ] `/me/reviews` で自分の投稿に **「承認待ち」バッジ**が付く
- [ ] admin（MFA 済）で `/admin/reviews` を開く → 承認待ち一覧に当該レビューが出る
- [ ] admin で **「承認」** → 製品ページをリロード → **公開表示される**
- [ ] admin ダッシュボード（`/admin`）の **「承認待ちレビュー」件数カード**が承認後に減る

## C. 却下 → 再投稿

- [ ] 別のレビューを投稿し、admin で **「却下」**（理由を入力）
- [ ] 製品ページに公開されない／`/me/reviews` で **「非公開（却下）」バッジ**（ホバーで理由）
- [ ] 同じ farmer・同じ製品に**再投稿** → 受け付けられ、再び「承認待ち」になる（古い却下行は置き換わる）
- [ ] 承認待ちの状態でさらに投稿しようとすると **「投稿済みのレビューは承認待ちです」** と表示

## D. 編集 = 再承認待ち（仕様確認）

- [ ] 公開済みの自分のレビューを編集・保存
- [ ] 製品ページから一旦消える（再び pending）／`/me/reviews` で「承認待ち」に戻る
- [ ] admin で再承認 → 再び公開表示される
  - ※ 「編集したら消えた」と感じる挙動。**奥田さんの判断待ち**（再承認待ちにする方針か／編集後即再公開にするか）。方針確定後、必要なら画面に注意書きを追加。

## E. マイページ / パスワード変更

- [ ] ヘッダーのユーザーメニュー → **「アカウント設定」** / 直接 `/settings` が**全ロールで**開ける
- [ ] メールアドレス・属性（ロール）が正しく表示される
- [ ] パスワード変更：**現在PWを間違える** → エラー「現在のパスワードが正しくありません」
- [ ] パスワード変更：**正しい現在PW + 新PW（6文字以上）** → 成功、**変更後もログイン維持**
- [ ] 確認用PW不一致 → エラー／新PWが6文字未満 → エラー
- [ ] 変更後、一度ログアウト → **新しいパスワードでログインできる**

## F. 回帰（既存が壊れていないか）

- [ ] レビューが**ある**製品ページが 500 せず、backfill された既存レビューが従来どおり公開表示
- [ ] レビューが**ない**製品ページが 500 せず「レビュー募集中」表示
- [ ] `/me/reviews` がレビュアーロールで開ける（pending/approved/rejected が混在表示）
- [ ] admin の既存サブ画面（メーカー承認・通報管理など）が従来どおり開ける

## G. ファビコン（新規）

- [ ] ブラウザのタブに **緑地 × 白い芽（Sprout）** のアイコンが出る（Vercel デフォルトではない）
  - ※ 反映されない場合はハードリロード／タブ閉じ直し（ブラウザのfaviconキャッシュ）
- [ ] スマホ（iOS）でホーム画面に追加 → **緑の芽アイコン**になる（apple-icon）
- [ ] ヘッダー左ロゴ（芽）とタブのアイコンが同じブランド表現で揃って見える

## H. ヘッダー（検索ボタン削除）

- [ ] PC 幅のヘッダー右側から **「検索」ボタンが消えている**
- [ ] ナビ（資材／記事／製造元）・ログイン／新規登録・ユーザーメニューは従来どおり表示
- [ ] レイアウト崩れがない（右寄せの間隔など）

---

## 既知の注意・補足

- **奥田さんがログインできない件**：原因の最有力は「ブラウザ保存パスワードが本番用と不一致」（dev/prod で Supabase プロジェクトが別なため）。コード変更の前に、**保存値に頼らず正しいPWを手入力**して切り分け。入れない場合は本番 Supabase Studio で当該アカウントの存在＋`email_confirmed_at` を確認。
- **新規登録のメール確認**：本番は SMTP 未設定のため `SIGNUP_REQUIRE_EMAIL_CONFIRM=false`（登録即ログイン可）。SMTP 整備後に戻す。
- **CI の注意**：GitHub Actions の CI workflow はまだ main に無い（PR #38 未マージ）。main 宛 PR に自動ゲートが効くのは PR #38 マージ後。それまでは手動で `pnpm tsc --noEmit && pnpm eslint . && pnpm vitest run` を回す。

---

## 本番デプロイ前ゲート（必須・順序厳守）

backend は `reviews.status` にハード依存。**順序を誤ると全製品ページが 500**。

1. ローカル CLI を**本番**（`sajxnypkbybuzsqdguaa`）に向ける（現状は dev に link）
2. 本番に migration `20260613000000` を適用（additive ＋ 既存を `approved` backfill）
3. 本番で `NOTIFY pgrst, 'reload schema';`
4. **確認SQL（本番に対して read-only、全部パスするまで先に進まない）**
   ```sql
   -- (a) 4列存在
   SELECT column_name FROM information_schema.columns
    WHERE table_name='reviews'
      AND column_name IN ('status','approved_by','approved_at','rejection_reason');
   -- (b) migration 記録
   SELECT version FROM supabase_migrations.schema_migrations WHERE version='20260613000000';
   -- (c) backfill 正常（既存は approved、legacy に pending が無い）
   SELECT status, count(*) FROM reviews GROUP BY status;
   -- (d) 2本目FK存在（埋め込みヒント解決のため）
   SELECT conname FROM pg_constraint WHERE conrelid='reviews'::regclass AND contype='f';
   ```
   さらに `GET /v1/products/<既存product-id>/reviews` が **200**（500でない）
5. 本番向け `pnpm gen:types` → コミット
6. `bash backend/deploy-prod.sh`（`SIGNUP_REQUIRE_EMAIL_CONFIRM=false` / CORS の `^|^` 区切りは検証済）→ ヘルス確認
7. frontend（Vercel）を最後にデプロイ → 上記 A〜H のスモークを本番で再確認
8. 問題があれば Cloud Run リビジョンを即ロールバック（migration は additive なので DB ロールバック不要）
