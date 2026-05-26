# admin-aglist-v2 + 2FA dev deployment log

**期間**: 2026-05-26
**ブランチ**: `feat/admin-aglist-v2`(Day 1 + Day 2), `feat/admin-v1-2fa`(PR #31, ADR-0012)
**Supabase**: `farmille-dev` (chgrudbattvmcjxhaskh, Northeast Asia / Tokyo)
**目的**: spec `docs/specs/admin-aglist-alignment-v2.md` の v1 必達分を dev 適用 + 2FA UAT。

---

## 1. 適用済 migration (dev)

```
20260526000000_admin_aglist_v2_products_columns.sql       — products に 11 列追加 + UNIQUE(name,maker_id) + index
20260526000001_admin_aglist_v2_application_recipes.sql    — product_application_recipes 新規 + RLS select_all
20260526000002_admin_aglist_v2_product_images_columns.sql — product_images に 6 列追加 + partial index
```

`supabase db push --linked` で適用済。`pnpm gen:types:dev` で型再生成 → `frontend/src/types/database.types.ts` を commit (`342ee4d`)。

### 適用時 trap: events-v1 PR #29 の migration が remote 先行

remote (`20260514120000_events_and_registrations`, `20260514120001_maker_email_campaigns`) が local に無いため CLI が history mismatch で停止。
**回避**: 同名の空 stub (`SELECT 1;`) を一時的に `supabase/migrations/` に置いてから `db push` → 終了後に stub を削除。
**恒久対応**: events-v1 が main へ merge されれば本ブランチも main を取り込み解消する。

---

## 2. 保留中 migration (dev / prod とも未適用)

```
20260526000003_seed_products_from_ryosei_export.sql   — Excel データの seed
```

理由: seed 内で参照される 3 メーカー (`ICL JAPAN` / `アグロ カネショウ` / `愛知製鋼`) が `public.users` + `maker_profiles` に未登録。
適用するとサブクエリが 0 行を返し全 INSERT が silent skip になる(spec §3.3 / §6 R6 の意図通りの fail-safe だが、結果として 0 件投入)。

**Ryosei sync 後の解凍手順**:
1. 3 メーカーを通常の signup → admin 承認フローで登録(prod 同等の挙動)
2. helper を再実行(必要なら) → seed migration を再生成
3. `supabase db push --linked` で適用
4. `SELECT COUNT(*) FROM products WHERE updated_at > '2026-05-26';` で確認

---

## 3. Supabase Auth 設定の事故 + 修正

### Site URL 不一致

farmille-dev に `https://farmille.vercel.app` が設定されていた → TOTP enroll で GoTrue が "site url is improperly formatted" を返し /auth/v1/factors が 500。

**修正**:
- farmille-dev Site URL: `http://localhost:3000`
- farmille-prod Site URL: `https://farmille.vercel.app` (本番側はそのまま)
- 副作用: dev TOTP issuer がアプリ上「localhost:3000」表記になる(正しい)

### Redirect URLs allow list

Vercel preview deploy 用に dev の **Authentication → URL Configuration → Redirect URLs** に追加するパターン:
```
http://localhost:3000/**
https://farmille-git-*-ryoga-sakais-projects.vercel.app/**
```

---

## 4. role drift bug (task #5)

| 場所 | 値 |
|---|---|
| `public.users.role` | `admin` |
| `auth.users.raw_app_meta_data.role` | `farmer` |

ADR-0012 後の admin guard はすべて `app_metadata.role` を見る (`getRole()`, `signIn` action, backend `jwt.py`)。
`public.users.role` を SQL 直で書き換えると JWT 側が乖離し guard が機能しなくなる。

**dev hotfix**:
```sql
UPDATE auth.users
   SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"admin"')
 WHERE id = '257b4a60-0115-475e-a9f1-5ca7a6e55bd7';
```
適用後はサインアウト → 再ログインで JWT 更新が必要。

**恒久対応案** (まだ未適用 / 未コミット): `docs/migrations-draft/role-drift-trigger.sql` を参照。
`public.users.role` UPDATE 時に auth.users.raw_app_meta_data を自動同期する trigger を追加する案。

---

## 5. UAT 通過状況 (spec §8 ベース)

| § | 項目 | 結果 |
|---|---|---|
| 8.1 | `/admin/products` を AAL2 admin で開ける | ✅(MFA enroll → 自動着地) |
| 8.1 | サイドバーに「資材マスタ」表示 | ✅ |
| 8.1 | dashboard に products カード(総数 / 公開中) | ✅ |
| 8.2 | 編集画面のプリフィル + is_public toggle 保存 | ⏸ Ryoga 帰還後 |
| 8.3 | 投入(seed migration 経路) | ⏸ Ryosei sync 待ち |
| 8.4 | AAL2 負ケース | ⏸ 後日 (pytest 側は緑) |
| 8.5 | /admin/makers regression | ⏸ Ryoga 帰還後 |

---

## 6. 補足: TOTP QR レンダリングのバグ修正

`<img src={data:image/svg+xml;utf-8,...}>` 形は GoTrue が返す inline SVG をブラウザが reject(`;charset=utf-8` 必須)。
`dangerouslySetInnerHTML` で SVG をそのまま DOM 注入する形に変更 (`fix(web): render TOTP QR as inline SVG to fix browser data URI parsing`, commits `86b805c` / `b8a8fae`)。
size は Tailwind の `!w-56 !h-56` で SVG 内属性を override。

---

## 7. 次の Manual Step (戻ったとき)

- [ ] PR #31 (`feat/admin-v1-2fa`) を main へ merge するか判断
  - 注: prod 自動 deploy 後、prod admin (Ryoga 1 名) が MFA enroll 完了するまで /admin/* に入れなくなる
  - 注: prod Supabase の MFA TOTP が有効化されているか dashboard で要確認
- [ ] `feat/admin-aglist-v2` の PR を base=main で open (#31 merge 後)
- [ ] prod migration A/B/C 適用 (link 切替 → `db push`)
- [ ] prod でも `pnpm gen:types` (必要なら) + 適用件数確認
- [ ] role drift trigger を採用するか判断 → 採用なら `docs/migrations-draft/role-drift-trigger.sql` を `supabase/migrations/` に移して push
- [ ] Ryosei さんと Excel populated 件数(現状 15 / 想定 181)を sync
- [ ] spec `admin-aglist-alignment.md` (v1 draft) の扱い: 残置 / archive へ移す
