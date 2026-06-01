# P0 ship checklist — feat/admin-aglist-v2 → main (2026-05-27)

このチェックリストを上から順に踏むと、prod 落とさず main にマージできる。
所要時間目安: **約 60-90 分** (UAT 30 分 + migration 5 分 + audit 5 分 + PR review 待ち)。

> **背景**: 本ブランチには (1) admin master CRUD + (2) public AgList 拡張 + (3) admin
> 周り polish + Material 3 fixes + B6 Users MVP + 関連 spec 改訂が乗っている。
> prod 自動デプロイで /admin/* が 500 にならないよう migration を先行させる必要あり。
> 詳細は `docs/drafts/aglist-v2-pr-description.md` 参照。

---

## STEP 0: prod Supabase の状態確認 (5 分、ブラウザ作業)

すべて Supabase Dashboard で確認:

- [ ] **prod Supabase の MFA (TOTP) が enabled**
  - https://supabase.com/dashboard/project/sajxnypkbybuzsqdguaa/auth/providers
  - 「Auth Providers → Phone, Email, ... の下にある "Multi-Factor Authentication"」セクションで TOTP が ON
  - 未 enable なら admin が prod /admin/* に入れなくなるため、ここで enable してから次へ
- [ ] **prod Supabase の Site URL = `https://farmille.vercel.app`**
  - https://supabase.com/dashboard/project/sajxnypkbybuzsqdguaa/auth/url-configuration
  - dev の Site URL (`http://localhost:3000`) と混同しない
  - redirect URLs allow list に `https://farmille.vercel.app/**` と `https://farmille-git-*-ryoga-sakais-projects.vercel.app/**` が入っているか確認
- [ ] **prod admin (Ryoga 自身) の `auth.users.raw_app_meta_data.role` = `"admin"`**
  - SQL editor で `SELECT id, email, raw_app_meta_data->>'role' as role FROM auth.users WHERE email = '<Ryoga email>';`
  - `public.users.role` 側だけ admin で auth 側が farmer/maker のままなら ADR-0012 guard で弾かれる (role drift bug、reentry §3 参照)
  - drift してたら setup-log-admin-aglist-v2.md §4 の hotfix SQL を prod で実行

---

## STEP 1: PR #31 (2FA, ADR-0012) を main に merge (10 分)

> 本 PR の admin layout AAL2 guard は PR #31 の backend 側 `jwt.py` 改修に依存。
> PR #31 を先に merge する。

- [ ] PR #31 を GitHub UI で確認:
  - `gh pr view 31 --web`
- [ ] Vercel preview で /mfa/setup → /admin が動くか目視
- [ ] approve + merge (squash 推奨、commit メッセージは PR description のまま)
  - `gh pr merge 31 --squash --delete-branch`
- [ ] Vercel auto-deploy が SUCCESS で完了するまで待つ (約 3 分)
- [ ] prod で Ryoga admin として `https://farmille.vercel.app/mfa/setup` に入れる
  - 入れない場合は STEP 0 の MFA enabled / Site URL を再確認

---

## STEP 2: prod Supabase に migration A/B/C を適用 (5 分、CLI 作業)

> seed migration D は適用しない (3 メーカー未登録のため空 INSERT skip となるが、
> 適用しても害はない。本 PR 直後 UAT には不要)。

```bash
cd /Users/ryogasakai/dev/farmille

# 現在 dev に link されているはず。一旦 prod に切替
supabase link --project-ref sajxnypkbybuzsqdguaa
# パスワード求められたら 1Password の "Supabase farmille-prod" を貼る

# 適用前に何が pending か確認
supabase db push --linked --dry-run

# 期待される pending:
#   20260526000000_admin_aglist_v2_products_columns.sql
#   20260526000001_admin_aglist_v2_application_recipes.sql
#   20260526000002_admin_aglist_v2_product_images_columns.sql
# (seed migration 20260526000003 は skip 想定だが listed されていれば次の "events-v1
#  history mismatch" workaround が必要かも、setup-log §1 参照)

# 実適用
supabase db push --linked

# 適用後の確認 SQL (Studio で実行):
#   SELECT count(*) FROM products;                                    -- 既存件数 (0 か事前 seed 分)
#   SELECT count(*) FROM information_schema.columns
#     WHERE table_name='products' AND column_name='is_public';        -- 1
#   SELECT count(*) FROM information_schema.tables
#     WHERE table_name='product_application_recipes';                 -- 1

# dev に link を戻す (重要、忘れると以後 dev 操作が prod に行く)
supabase link --project-ref chgrudbattvmcjxhaskh
```

- [ ] migration A/B/C 適用済 (exit 0)
- [ ] 確認 SQL 3 件 OK
- [ ] dev に link を戻した

---

## STEP 3: 依存セキュリティ監査 (5 分)

```bash
cd /Users/ryogasakai/dev/farmille/frontend
pnpm audit --audit-level=high
# 期待: "No known vulnerabilities found" または low / moderate のみ

cd /Users/ryogasakai/dev/farmille/backend
uvx pip-audit
# 期待: "No known vulnerabilities found"
```

- [ ] `pnpm audit --audit-level=high` exit 0 / high+ なし
- [ ] `uvx pip-audit` exit 0 / high+ なし
- [ ] high+ が出た場合は本 PR 着手前に hotfix で塞ぐ (memory: deploy-blocking 防衛優先)

---

## STEP 4: dev で §8 UAT 8.1-8.5 を踏む (30 分)

dev 環境で実機確認。spec §8 の全項目:

### 8.1 admin/products 一覧
- [ ] `/admin/products` を AAL2 admin で開ける
- [ ] 検索ワード入力 → 結果絞り込み + URL `?q=` 反映
- [ ] フィルタ 2 つ重ね (例: maker + is_public) が AND で効く
- [ ] pagination 前後ページ移動
- [ ] サムネが is_primary=true で表示、無い行は placeholder
- [ ] **追加 (H1/H2)**: 検索 / フィルタ submit してもスクロール位置が保持される
- [ ] **追加 (H2)**: 非 active メーカー所有の product 行に「承認待ち / 却下 / 凍結」バッジ

### 8.2 admin/products/[id] 編集
- [ ] 既存値プリフィル (10 新規列含む)
- [ ] is_public toggle ON/OFF で保存 → 再表示で反映
- [ ] confidence は read-only
- [ ] 一部だけ変更 → 保存 → 他項目消えてない
- [ ] v1 必達 3 種 relation (crops/certifications/benefits) 保存
- [ ] application_recipes が read-only テーブル表示 (該当データなければ「該当データなし」)

### 8.3 投入 (本日は skip 可、3 メーカー登録後に別途)
- ~~dev で excel_to_seed_sql.py を実行~~
- ~~supabase db push で seed 適用~~

### 8.4 AAL2 負ケース (curl 込み、4 件)
- [ ] AAL1 admin で `/admin/products` → `/mfa/challenge?next=/admin/products` リダイレクト
- [ ] AAL1 Bearer で `curl /v1/admin/products` → 401 `aal_insufficient`
- [ ] AAL1 Bearer で `curl /v1/admin/products/{id}` PUT → 401 `aal_insufficient`
- [ ] non-admin (farmer) の AAL2 Bearer で `curl /v1/admin/products` → 403 `not_admin`

### 8.5 regression
- [ ] ADR-0009 `/admin/makers` 承認フロー動作
  - [ ] **追加 (H4)**: 却下 → 理由入力 → 成功 banner 2 秒 → 行が消える、Railway log に `maker_rejected ... reason='...'`
- [ ] ADR-0012 MFA gate 効いてる
- [ ] 既存 reviews × products 関連壊れてない
- [ ] 既存 maker UI で自社 products 編集動く

### 追加 UAT (本 PR 新規スコープ)
- [ ] **F7 public AgList**: `/products` `/products/[id]` `/manufacturers` `/manufacturers/[id]` `/articles` `/articles/[slug]` `/products/new` `/me/profile` `/maker/profile` を visit、hero band 表示
- [ ] **G1 spinner delay**: `/` → `/products` クリック → spinner が一瞬光らない (300ms 未満 navigation)
- [ ] **G2 scroll preservation**: `/products` で下スクロール → フィルタ操作 → スクロール位置維持
- [ ] **G3 TypeFilter 非表示**: `/products` フィルタ panel に「タイプ: すべて / BS資材」pill が出てない
- [ ] **G4 search bar focus**: `/products` 検索 input に focus → container border が緑、caret 視認可
- [ ] **H5 B6 Users**: `/admin/users` 一覧表示、role 変更 1 件試す (例: farmer → ja_staff は不可で 400、admin → ja_staff は OK)

---

## STEP 5: PR を open (5 分)

```bash
cd /Users/ryogasakai/dev/farmille
git push -u origin feat/admin-aglist-v2

gh pr create \
  --base main \
  --head feat/admin-aglist-v2 \
  --title "feat: F7 public AgList + admin master CRUD + B6 users MVP" \
  --body-file docs/drafts/aglist-v2-pr-description.md
```

- [ ] PR 作成成功、URL が返る
- [ ] Vercel preview デプロイ完了
- [ ] preview URL で smoke test (主要ページ visit、admin login)

---

## STEP 6: code review (時間枠次第)

memory「ロール - 私は worker、reviewer は別セッション」と整合させる場合:

- [ ] 別 Claude セッションで `/code-review` または `/gsd:code-review` を本 PR に対して走らせる
- [ ] 出た指摘を本 worker セッション (= 私) に伝えて適用

時間がないなら self-review でも可 (奥田さんへ事後共有前提)。

---

## STEP 7: main へ merge (5 分)

```bash
gh pr merge <PR番号> --squash --delete-branch
```

- [ ] merge 成功
- [ ] Vercel auto-deploy SUCCESS (frontend, 約 3 分)
- [ ] Railway auto-deploy SUCCESS (backend, 約 2-4 分)
- [ ] prod `/admin/products` で UAT §8.1 の冒頭 (一覧表示 + AAL2 通過) だけ最終確認
- [ ] prod `/` (公開ホーム) で AgList トーン崩れがないか目視

---

## STEP 8: ローカル後処理 (3 分)

```bash
git checkout main
git pull
git branch -d feat/admin-aglist-v2
```

- [ ] local main を更新
- [ ] feat ブランチ削除
- [ ] 必要なら他の open work (PR #31 cherry-pick 系) を整理

---

## ロールバック手順 (使う場合)

prod で深刻な不具合が出た場合:

```bash
# 1. 直前の prod 動作版 commit に main を戻す
gh pr list --base main --state merged --limit 5
git log main --oneline -10
# 戻したい sha を確認 (本 PR merge の 1 つ前)

git checkout main
git pull
git revert <merge sha> --no-edit
git push origin main
# Vercel + Railway が前バージョンに自動 re-deploy

# 2. prod Supabase の migration A/B/C は ROLLBACK しなくて OK
# (新カラム / 新テーブルは旧コードから無視されるだけで害なし)
# どうしても剥がしたい場合は手書きの reverse SQL を実行 (推奨しない)
```

---

## 関連ドキュメント

- `docs/drafts/aglist-v2-pr-description.md` — PR description 本体 (PR open 時に使用)
- `docs/setup-log-admin-aglist-v2.md` — dev 適用ログ + 既知の trap
- `docs/specs/admin-aglist-alignment-v2.md` — v1 必達 spec
- `docs/decisions/0009-maker-approval-flow-and-admin-panel.md` — admin layout 設計
- `docs/decisions/0012-admin-2fa-promotion-to-v1.md` — 2FA gate 設計
