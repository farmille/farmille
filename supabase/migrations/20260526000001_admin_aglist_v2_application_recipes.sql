-- ============================================================
-- Spec: docs/specs/admin-aglist-alignment-v2.md §4.2 migration B
-- AgList alignment v2: 新規テーブル product_application_recipes
-- ============================================================
--
-- Excel sheet `application_recipes`（163 行 × 21 列、v1 末は 162 行投入）の
-- 受け入れ先。RLS は anon/authenticated SELECT 全行開放 + 書き込みは
-- BFF service_role のみ（既存 admin pattern 準拠、spec §4.2 / §4.3）。
--
-- dose_amount / max_dose_amount は numeric。Excel 上は "100-150" のような
-- レンジ表記や "不明" が混在するため、helper 側で raw_text に逃がし、
-- 単一数値のみ numeric に格納する（NULL 許容）。

CREATE TABLE product_application_recipes (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id                 uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  crop_category              text,
  crop_name                  text,
  cultivation_type           text,
  application_method         text,
  application_timing         text,
  growth_stage               text,
  dilution_rate              text,
  dose_raw_text              text,
  dose_amount                numeric,
  dose_unit                  text,
  dose_basis                 text,
  solution_amount            text,
  original_liquid_equivalent text,
  max_dose_raw_text          text,
  max_dose_amount            numeric,
  max_dose_unit              text,
  usage_notes                text,
  precautions_specific       text,
  confidence                 text,
  sort_order                 int NOT NULL DEFAULT 0,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_application_recipes_product
  ON product_application_recipes (product_id);

-- updated_at 自動更新 trigger（既存 update_updated_at() 関数を reuse、
-- 20260415000000_farmille_init.sql L345 で定義済、spec §4.2 Q-R4 確定）
CREATE TRIGGER trg_product_application_recipes_updated_at
  BEFORE UPDATE ON product_application_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS (spec §4.3 と整合)
ALTER TABLE product_application_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_application_recipes_select_all"
  ON product_application_recipes
  FOR SELECT TO anon, authenticated USING (true);

-- 書き込み policy は意図的に作らない（policy 不在 = 拒否、
-- BFF service_role が唯一の書き込み経路、spec maker-approval-admin.md §7.2）。
