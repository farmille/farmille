## 概要
<!-- 何をやったか 1〜3 行 -->

## 変更点
<!-- 箇条書きで主要変更。DB スキーマ変更があれば必ず明記 -->
-

## 動作確認
- [ ] ローカルで起動確認（frontend: `pnpm dev` / 全体: `make dev`）
- [ ] 該当画面 / API の手動動作確認
- [ ] 型チェック（`pnpm tsc --noEmit`）通過
- [ ] Vercel Preview で実画面を確認（UI 変更時）
- [ ] 関連する既存機能に影響なし

## 影響範囲の確認
- [ ] DB スキーマ / RLS を変更していない（変更時は migration + ADR + CTO レビュー）
- [ ] frontend から `supabase.from/rpc` を直接呼んでいない（BFF 原則）
- [ ] `docs/design-tokens.md` の禁止事項に反していない（UI 変更時）
- [ ] 秘密情報（service_role / JWT secret / `.env*`）をコミットしていない

## 本番フリーズ確認
<!-- ADR-0016: フリーズ中は approve まで。merge は CTO が保留 -->
- [ ] 本 PR は本番フリーズ方針を理解した上で出している（merge 可否は CTO 判断）

## スクリーンショット
<!-- UI 変更時のみ。before / after -->

## 関連
<!-- Issue #XXX / ADR-NNNN -->
-
