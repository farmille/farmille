# draft: aglist-v2 PR description

When PR #31 (2FA) merges to main, open this PR with base=main and the
description below. Until then, leave the branch unmerged.

Suggested gh command:

```bash
gh pr create \
  --base main \
  --head feat/admin-aglist-v2 \
  --title "feat(admin): AgList alignment v2 — products master CRUD" \
  --body-file docs/drafts/aglist-v2-pr-description.md
```

(Strip the leading meta block before sending, or rewrite as plain
markdown — the H1 below is the actual PR title body.)

---

# feat(admin): AgList alignment v2 — products master CRUD

Closes the v1 spec
[`docs/specs/admin-aglist-alignment-v2.md`](../specs/admin-aglist-alignment-v2.md)
(Day 1 step 1–3 + Day 2 frontend), built on top of ADR-0012 admin 2FA.

## Summary
- 3 schema migrations (`products` +11 cols / new `product_application_recipes` / `product_images` +6 cols)
- 1 seed migration generated from `Farmille_BS_materials_DB_template_detailed_prompt.xlsm`
  (held — see "Not in this PR" below)
- `backend/scripts/excel_to_seed_sql.py` helper (depends on `openpyxl>=3.1.0`, added to `pyproject.toml`)
- Backend BFF `app/routers/admin_products.py` with list / detail / update + 28 pytest cases
- `/v1/admin/makers?status=active` and `products_total` / `products_public_total` on `/v1/admin/summary`
- Frontend `/admin/products` list (SSR, search + filter + pagination + badges)
- Frontend `/admin/products/[id]` edit (10 new cols + is_public toggle + 3 v1 relations + read-only recipes)
- Sidebar entry + dashboard products cards
- `pnpm gen:types:dev` regenerated `frontend/src/types/database.types.ts`
- Bonus fix: TOTP enroll QR rendering (data URI form was rejected by browsers)

Build / lint / tsc / pytest all green. 141 backend tests pass.

## Live state
- `dev` Supabase already has migrations A/B/C applied + types regenerated; seed migration D is NOT yet applied (waiting on real maker accounts for `ICL JAPAN` / `アグロ カネショウ` / `愛知製鋼`).
- `prod` Supabase has no migration from this PR yet — apply after merge.

## Design decisions
- `is_public` (DEFAULT false) is added as orthogonal to `commercial_status`, per spec Q3 (公開非公開 vs 流通状態は別概念).
- v1 必達 relations = `crops` + `certifications` + `benefits` のみ。残り 5 relation の編集 UI は §7 Follow-ups (F-FU12) に push。
- `maker_id` / `product_type_id` は v1 編集不可 (read-only)。変更は audit 観点で v1.5+。
- 投入経路は seed migration のみ。`one-off Python script with SERVICE_ROLE_KEY` パターンは spec §1.8 で禁止。
- 画像は外部 URL 直入力のみ。Storage upload UI は v1.5+ (§6 R4)。
- Spec `§2.2` の `maker_profiles.brand_name` 表記は誤記で実 schema は `company_name` のみ — spec を修正し実装は `company_name` フォールバック付きで運用。

## Not in this PR (Follow-ups)
- F2 新規作成 UI (`/admin/products/new`) — v1.5+ (F-FU8)
- CSV import UI — v1.5+ (F-FU4)
- 残 5 relation の編集 UI — v1.5+ (F-FU12)
- product_images の drag-and-drop 並べ替え — v1.5+
- 削除 + soft delete — v1.5+ (F-FU7)
- product_sources / product_review_flags テーブル投入 — v1.5+ (F-FU9 / F-FU10)
- seed migration D の dev / prod 適用 (3 メーカー登録後)
- role drift sync trigger — `docs/migrations-draft/role-drift-trigger.sql` に下書きあり

## Open flags
- spec §449 の 403 detail `not_admin` と実装 `RoleChecker` の generic メッセージが乖離(2FA branch 側 issue、tests は status code のみ assert)。
- `backend/tests/conftest.py` に `or_()` shim を追加(PostgREST の OR ilike テスト用)。「既存テストファイル不触」の境界。
- `backend/tests/test_admin_router.py::TestSummary` を更新(spec §3.4 で summary レスポンスに 2 fields 追加した必然的結果)。
- mypy が `admin_products.py` で ~450 警告(既存 `admin.py` と同じ supabase-py loose typing パターン、production 動作には無影響)。

## Test plan
- [ ] dev `/admin/products` でログインから一覧表示まで通過 (UAT §8.1)
- [ ] dev `/admin/products/[id]` で既存 product を 1 件編集 → 保存 → 再表示 (UAT §8.2)
- [ ] dev `/admin/makers` の承認フローに regression なし (UAT §8.5)
- [ ] dev `/admin` dashboard で products カードの件数が正しい
- [ ] backend `uv run pytest backend/tests/test_admin_products_router.py -v` 全 28 pass
- [ ] prod migration A/B/C 適用後、`/admin/products` を prod 環境で確認
- [ ] (seed 投入後) 件数 = Excel populated 数 - skip 数

🤖 Generated with [Claude Code](https://claude.com/claude-code)
