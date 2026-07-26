-- ============================================================
-- product_sources: 製品の出典（公式製品ページ / 公式PDF / SDS 等）
--
-- 背景: メーカー公式サイトの商品画像をホットリンク表示しており、
-- 出典リンクを明示しないと著作権上の懸念が残る。商品詳細ページから
-- 「該当 BS 資材かの最終確認」を公式ページへ飛んで行えるようにする。
--
-- データ源: Farmille_BS_materials_DB_template_detailed_prompt.xlsx
-- `sources` シート（605 行 / 253 製品、source_rank S:531 A:30 B:39 C:5）。
-- これまで「リサーチ資料として保持のみ」だったものを DOA 方針
-- （正規化・1:N をそのまま表現）に従いテーブル化する。
--
-- 書き込みは v1 では seed / service_role 経由のみ（INSERT/UPDATE policy なし）。
-- maker 自身による編集 UI は v1.5+ で検討。
-- ============================================================

CREATE TABLE product_sources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_type    text NOT NULL,  -- 公式製品ページ / 公式PDF / 公式SDS / 代理店ページ など
  title          text,
  url            text NOT NULL,
  rank           text CHECK (rank IN ('S', 'A', 'B', 'C')),
  extracted_date date,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 詳細ページの JOIN 取得用
CREATE INDEX idx_product_sources_product_id ON product_sources (product_id);

-- RLS: products / product_images と同じく誰でも閲覧可。書き込み policy は置かない
-- （service_role は RLS bypass のため seed / admin 経由の書き込みは可能）。
ALTER TABLE product_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_sources_select_all" ON product_sources
  FOR SELECT TO anon, authenticated USING (true);
