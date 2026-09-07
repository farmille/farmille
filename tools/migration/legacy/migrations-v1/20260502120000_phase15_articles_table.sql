-- spec §4.1 の set_updated_at は記述ミスで、既存 init.sql の関数名 update_updated_at() を採用

-- 記事カテゴリは固定 enum（v1 は 4 カテゴリで開始、追加は migration で）
CREATE TABLE articles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        NOT NULL UNIQUE
                              CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 80),
  title           text        NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  body_md         text        NOT NULL CHECK (length(body_md) BETWEEN 1 AND 50000),
  hero_image_url  text,
  category        text        NOT NULL
                              CHECK (category IN ('monthly_report','weekly_report','featured','column')),
  author_user_id  uuid        REFERENCES users(id) ON DELETE SET NULL,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX articles_published_at_idx
  ON articles (published_at DESC NULLS LAST)
  WHERE published_at IS NOT NULL;

CREATE INDEX articles_category_published_at_idx
  ON articles (category, published_at DESC NULLS LAST)
  WHERE published_at IS NOT NULL;

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 記事×製品（中間）
CREATE TABLE article_products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position    int         NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, product_id)
);

-- SKILL §3.1: 中間テーブルの 2 番目 FK 逆引き index 必須
CREATE INDEX article_products_product_id_idx
  ON article_products (product_id);

CREATE INDEX article_products_article_id_position_idx
  ON article_products (article_id, position);
