# draft: aglist-v2 PR description

When PR #31 (2FA) merges to main, open this PR with base=main and the
description below. Until then, leave the branch unmerged.

Suggested gh command:

```bash
gh pr create \
  --base main \
  --head feat/admin-aglist-v2 \
  --title "feat: F7 public AgList + admin master CRUD + B6 users MVP" \
  --body-file docs/drafts/aglist-v2-pr-description.md
```

(Strip the leading meta block before sending, or rewrite as plain
markdown — the H1 below is the actual PR title body.)

---

# feat: F7 public AgList + admin master CRUD + B6 users MVP

Closes the v1 spec
[`docs/specs/admin-aglist-alignment-v2.md`](../specs/admin-aglist-alignment-v2.md)
(F1/F3/F4/F5/F6 = admin master + F7 = public AgList tone),
built on top of ADR-0012 admin 2FA (PR #31).

## Summary

**Admin master (F1-F6)**

- 3 schema migrations (`products` +11 cols / new `product_application_recipes` / `product_images` +6 cols)
- 1 seed migration generated from `Farmille_BS_materials_DB_template_detailed_prompt.xlsm`
  (held — see "Not in this PR" below)
- `backend/scripts/excel_to_seed_sql.py` helper (depends on `openpyxl>=3.1.0`)
- Backend BFF `app/routers/admin_products.py` with list / detail / update + 28 pytest cases
- `/v1/admin/makers?status=active` and `products_total` / `products_public_total` on `/v1/admin/summary`
- `/admin/products` list (SSR, search + filter + pagination + badges)
- `/admin/products/[id]` edit (10 new cols + is_public toggle + 3 v1 relations + read-only recipes)
- Sidebar entry + dashboard products cards

**Public AgList tone (F7 — newly added per spec §0.2 #3.1 correction)**

- `SiteHeader` (dark-green AgList, Sprout logo) + `SiteFooter` (4-col + © bar) — both
  mounted in `app/layout.tsx` with shared `HIDDEN_PATH_PREFIXES`
- `/products` list: hero band + 4-col grid + Material 3 search bar + URL `?q=` persistence
- `/products/[id]` detail: breadcrumb + 2-col image + DetailRow + tag chip groups
- `/manufacturers` list + detail with same hero / grid / breadcrumb pattern
- Extended to `/articles` + `/articles/[slug]` + `/products/new` + `/me/profile` + `/maker/profile`
- `ArticleCard` / `RelatedProductCard` rewritten to share AgList card shell

**Admin polish (H1-H5)**

- F1: Material 3 search (Next.js 16 `<Form scroll={false}>` + container focus), scroll
  preservation, status badge next to maker_name (active/pending/rejected/frozen)
- F3: per-relation error code `failed_to_update_relations:{crops|certifications|benefits}`
  with structured logs (reviewer-driven, spec §6 R3 integrity)
- B1: reject reason inline banner success + audit trail via `logger.info("maker_rejected ...")`
  to Railway logs (no migration; v1.5+ F-FU6 will table this)
- B6 `/admin/users` MVP: list + role change (`admin` / `ja_staff` / `researcher`) via
  existing `POST /v1/admin/users/{id}/role`. New endpoint `GET /v1/admin/users`.

**UX / a11y / design-tokens v2 (Material 3 + Nielsen Norman)**

- `NavigationOverlay` 300ms threshold — spinner suppressed for fast navigation
  (Nielsen Norman 0.1s = instant)
- Filter / search `router.push` uses `{ scroll: false }` — preserves grid position
- Search bar focus moves to container (Material 3 search pattern) with caret breathing room
- 4 overlay tokens (`--overlay-on-{dark,light}-{soft,strong}`) replace scattered `rgba(255,255,255,X)`
- All `#ffffff` direct embedding replaced with `var(--text-on-green)`
- `focus-visible:ring-2` on all interactive elements (WCAG 2.4.7)
- `text-[10px]` / `text-[11px]` removed (design-tokens §3 scale compliance)
- `py-14` → `py-12` (design-tokens §4 scale compliance)
- `TypeFilter` hidden when only 1 active product_type (UX noise removal)

**Bonus fixes**

- TOTP enroll QR rendering (data URI form was rejected by browsers)
- TOTP enroll error message actionable (site URL / MFA disabled / rate limit / aal required)

Build / lint / tsc / backend pytest (admin) all green. 69 admin pytest cases pass.

## Spec narrative correction (§0.2 #3.1)

The original v1 spec mis-classified public AgList styling under §7 F-FU2 (v1.5+).
This PR corrects that to **§1.1 F7 within v1 scope** because biz lead 奥田さん's Q2
("AgList トーンに寄せる") was always intended for v1. The §7 F-FU2 entry is now
struck through, and a new F-FU14 entry tracks the inline `borderRadius` → Tailwind
config refactor that was intentionally deferred (visually equivalent).

## Live state (as of merge time)

- `dev` Supabase: migrations A/B/C applied + types regenerated. Seed migration D NOT
  applied (waiting on `ICL JAPAN` / `アグロ カネショウ` / `愛知製鋼` real maker accounts).
- `prod` Supabase: **must apply migrations A/B/C before this PR's auto-deploy reaches users**.
  See "Pre-merge checklist" below.

## Pre-merge checklist (deploy ordering)

1. PR #31 (2FA, ADR-0012) merged to main with prod Supabase MFA TOTP **enabled** and
   Site URL = `https://farmille.vercel.app` confirmed.
2. prod Supabase migrations A/B/C applied via:
   ```bash
   cd /Users/ryogasakai/dev/farmille
   supabase link --project-ref sajxnypkbybuzsqdguaa  # prod
   supabase db push --linked
   supabase link --project-ref chgrudbattvmcjxhaskh  # back to dev
   ```
3. `pnpm audit --audit-level=high` (frontend) and `uvx pip-audit` (backend) both clean
   on this branch.
4. §8 UAT 8.1-8.5 manually pass on dev.

## Design decisions

- `is_public` (DEFAULT false) is orthogonal to `commercial_status`, per spec Q3.
- v1 必達 relations = `crops` + `certifications` + `benefits` のみ。残り 5 relation
  の編集 UI は §7 Follow-ups (F-FU12) に push。
- `maker_id` / `product_type_id` は v1 編集不可 (read-only)。
- 投入経路は seed migration のみ。`one-off Python script with SERVICE_ROLE_KEY` は spec §1.8 で禁止。
- 画像は外部 URL 直入力のみ。Storage upload UI は v1.5+ (§6 R4)。
- Spec §2.2 の `maker_profiles.brand_name` 誤記は `company_name` に訂正済。

## Not in this PR (Follow-ups)

- F2 新規作成 UI (`/admin/products/new`) — v1.5+ (F-FU8)
- CSV import UI — v1.5+ (F-FU4)
- 残 5 relation の編集 UI — v1.5+ (F-FU12)
- product_images の drag-and-drop 並べ替え — v1.5+
- 削除 + soft delete — v1.5+ (F-FU7)
- product_sources / product_review_flags テーブル投入 — v1.5+ (F-FU9 / F-FU10)
- seed migration D の dev / prod 適用 (3 メーカー登録後)
- B6 frozen toggle / 削除 UI — v1.5+ (今回は role 変更のみ)
- B7 `/admin/featured-products` UI — v1.5+
- `/admin/banners` UI — v1.5+
- B2 `/admin/reports` UI — v1.5+ (通報フロー自体未実装)
- B3 `/admin/articles` UI — Git PR + markdown 運用 by design (ADR 系)
- inline `borderRadius: var(--radius-lg)` → Tailwind config 集約 — v1.5+ (F-FU14)
- hero `aria-label` のユニーク化 — v1.5+
- `/products/new` と `/maker/profile` eyebrow 重複解消 — v1.5+
- role drift sync trigger — `docs/migrations-draft/role-drift-trigger.sql` に下書き

## Open flags

- pre-existing pytest fixture name typo in `test_me_favorites.py` (`fake_supabase` vs
  `fake_admin`) — out of this PR's scope, hotfix candidate.
- spec §449 の 403 detail `not_admin` と実装 `RoleChecker` の generic メッセージが乖離
  (2FA branch 側 issue、tests は status code のみ assert)。
- `backend/tests/conftest.py` に `or_()` shim を追加 (PostgREST の OR ilike テスト用)。
- `mypy admin_products.py` で ~450 警告 (既存 `admin.py` と同じ supabase-py loose typing パターン、production 動作には無影響)。

## Test plan

- [ ] dev `/admin/products` でログインから一覧表示まで通過 (UAT §8.1)
- [ ] dev `/admin/products/[id]` で既存 product を 1 件編集 → 保存 → 再表示 (UAT §8.2)
- [ ] dev `/admin/makers` の承認フローに regression なし (UAT §8.5)、reject reason 入力 → 成功 banner → Railway log に `maker_rejected ... reason='...'`
- [ ] dev `/admin/users` で role 変更を 1 件試す (admin → ja_staff など) → confirm dialog → 成功 banner
- [ ] dev `/admin` dashboard で products カードの件数が正しい
- [ ] dev `/products` `/products/[id]` `/manufacturers` `/manufacturers/[id]` `/articles` `/articles/[slug]` `/products/new` `/me/profile` `/maker/profile` を visit して AgList hero band 表示確認
- [ ] dev `/products` で検索 / フィルタ → URL 反映 + スクロール位置保持
- [ ] Tab nav → 全 interactive 要素に focus ring 表示 (WCAG 2.4.7)
- [ ] backend `uv run pytest backend/tests/test_admin_products_router.py backend/tests/test_admin_router.py -v` 全 69 pass
- [ ] `pnpm audit --audit-level=high` (frontend) high+ なし
- [ ] `uvx pip-audit` (backend) high+ なし
- [ ] prod migration A/B/C 適用後、`/admin/products` を prod 環境で UAT §8.1-8.5 全項目
- [ ] (seed 投入後) 件数 = Excel populated 数 - skip 数

🤖 Generated with [Claude Code](https://claude.com/claude-code)
