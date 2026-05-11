-- Phase 18: ホーム集約用キュレーションテーブル
-- spec docs/specs/home.md §4.1
--
-- DOA 優先（SKILL §1.1）: 中間テーブル + マスタ参照、JSONB 不使用、各列素朴な型
-- 中間 featured_products の 2 番目 FK product_id に逆引き index 必須（SKILL §3.1）

-- ─────────────────────────────────────────────────────────
-- featured_products: 注目の資材（運営手動キュレーション）
-- ─────────────────────────────────────────────────────────
-- 単純な「products に flag を立てる」ではなく独立テーブルとして設計する理由:
--   1. 注目になっている期間（displayed_at）を表現する
--   2. 並び順（sort_order）を業務的に決めたい
--   3. v1.5+ で「期間別に複数 featured 履歴」要件が出たら
--      displayed_from / displayed_to に拡張しやすい
-- 自動ランキングは v1 不採用（SKILL §1.4）。本テーブルは集計 cache ではなく
-- 「運営の選定リスト」。
CREATE TABLE featured_products (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order   int         NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  displayed_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- 業務ルール: 同一 product を複数同時 featured にしない
  UNIQUE (product_id)
);

-- SKILL §3.1: 中間テーブル 2 番目 FK の逆引き index
CREATE INDEX featured_products_product_id_idx
  ON featured_products (product_id);

-- 一覧表示の主たる検索キー: 表示対象期間 + 並び順
CREATE INDEX featured_products_displayed_at_sort_order_idx
  ON featured_products (displayed_at DESC, sort_order ASC);

-- ─────────────────────────────────────────────────────────
-- home_banners: ホームバナー（自社記事 / キャンペーン告知）
-- ─────────────────────────────────────────────────────────
-- 商用広告 / アフィリエイトは v1 アウト（spec §13）。v1 では運営手動運用のみ。
-- displayed_at は articles の published_at と同じ「予約公開」パターン:
--   NULL = 非公開 / 未来 = 予約 / 過去 = 公開中
CREATE TABLE home_banners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  image_url    text        NOT NULL CHECK (length(image_url) BETWEEN 1 AND 2000),
  link_url     text        NOT NULL CHECK (length(link_url) BETWEEN 1 AND 2000),
  sort_order   int         NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  displayed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 公開判定 + 並び順用の部分 index（NULL は対象外）
CREATE INDEX home_banners_displayed_at_sort_order_idx
  ON home_banners (displayed_at DESC NULLS LAST, sort_order ASC)
  WHERE displayed_at IS NOT NULL;
