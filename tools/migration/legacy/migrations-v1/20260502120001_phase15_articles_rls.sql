ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 公開: published_at IS NOT NULL かつ 過去 のもののみ未ログインを含めて公開
CREATE POLICY "articles_select_all" ON articles
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());

-- 書き込みは service_role のみ（運営 SQL 直）。authenticated に書き込み権限を一切渡さない
-- → INSERT / UPDATE / DELETE ポリシーは作らない（policy 不在 = 拒否）

ALTER TABLE article_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_products_select_all" ON article_products
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles a
      WHERE a.id = article_products.article_id
        AND a.published_at IS NOT NULL
        AND a.published_at <= now()
    )
  );

-- 書き込みは service_role 経由のみ（運営 SQL 直）
