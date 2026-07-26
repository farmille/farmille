-- Phase 18: ホーム集約テーブルの RLS
-- spec docs/specs/home.md §4.2
--
-- 公開 SELECT のみ。書き込みは service_role 経由のみ（policy 不在 = 拒否）。
-- v1 では運営 SQL 直で投入する運用（管理画面なし、SKILL §1.4「やらない」）。

-- ─────────────────────────────────────────────────────────
-- featured_products
-- ─────────────────────────────────────────────────────────
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

-- 公開 SELECT: 表示時刻が現在以下のもののみ（予約公開の未来分は隠す）
CREATE POLICY "featured_products_select_all" ON featured_products
  FOR SELECT TO anon, authenticated
  USING (displayed_at <= now());

-- INSERT / UPDATE / DELETE policy は意図的に作らない → service_role 以外拒否

-- ─────────────────────────────────────────────────────────
-- home_banners
-- ─────────────────────────────────────────────────────────
ALTER TABLE home_banners ENABLE ROW LEVEL SECURITY;

-- 公開 SELECT: displayed_at が NULL でなく、かつ過去のもの
CREATE POLICY "home_banners_select_all" ON home_banners
  FOR SELECT TO anon, authenticated
  USING (displayed_at IS NOT NULL AND displayed_at <= now());

-- INSERT / UPDATE / DELETE policy は意図的に作らない → service_role 以外拒否
