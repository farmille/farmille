-- ============================================================
-- Farmille v1 初期マイグレーション
-- 作成日: 2026-04-15
-- 論理設計: 第3正規形まで完了
-- ============================================================

-- ============================================================
-- 第1層: 依存なしのマスタテーブル
-- ============================================================

-- 作目大分類
CREATE TABLE crop_categories_l1 (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- 製品種別マスタ
CREATE TABLE product_types (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text    NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

-- JBSA効果・効能タグマスタ（ver.1.0 25項目）
CREATE TABLE product_benefits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category   text NOT NULL CHECK (category IN ('栄養利用','ストレス耐性','収量品質','因果関係')),
  name       text NOT NULL UNIQUE,
  sort_order int  NOT NULL DEFAULT 0,
  version    text NOT NULL DEFAULT 'ver.1.0'
);

-- 農家独自の気に入ったポイントマスタ
CREATE TABLE review_points (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text    NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

-- 認証体系マスタ
CREATE TABLE certifications (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- 使用時期マスタ（月×上旬中旬下旬 = 36レコード固定）
CREATE TABLE periods (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month  int  NOT NULL CHECK (month BETWEEN 1 AND 12),
  period text NOT NULL CHECK (period IN ('early','mid','late')),
  UNIQUE (month, period)
);

-- 組成タイプマスタ（JBSA表１ 8分類）
CREATE TABLE product_composition_types (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text    NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

-- 技術分類マスタ
CREATE TABLE product_science_technologies (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text    NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

-- 施用方法マスタ
CREATE TABLE product_application_methods (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text    NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

-- 施用時期マスタ
CREATE TABLE product_application_windows (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text    NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

-- ============================================================
-- 第2層: 第1層に依存
-- ============================================================

-- 作目中分類
CREATE TABLE crop_categories_l2 (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_categories_l1_id uuid NOT NULL REFERENCES crop_categories_l1(id),
  name                  text NOT NULL,
  UNIQUE (crop_categories_l1_id, name)
);

-- ユーザー（auth.usersと1:1対応）
-- NOTE: auth.users は Supabase が管理するため直接触らない
--       ユーザー登録時に trigger で public.users にも INSERT する
CREATE TABLE users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('farmer','maker','ja_staff','researcher','unassigned')),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 第3層: 第2層に依存
-- ============================================================

-- 作目（申請→承認フロー付き）
CREATE TABLE crops (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_categories_l2_id uuid NOT NULL REFERENCES crop_categories_l2(id),
  name                  text NOT NULL,
  status                text NOT NULL DEFAULT 'approved'
                             CHECK (status IN ('pending','approved','rejected')),
  created_by            uuid REFERENCES users(id) ON DELETE SET NULL
);

-- 農家プロフィール
CREATE TABLE farmer_profiles (
  user_id    uuid    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  prefecture text    NOT NULL,
  city       text    NOT NULL,
  field_size numeric,          -- アール単位 nullable
  note       text              -- 自由記入 nullable
);

-- メーカープロフィール
CREATE TABLE maker_profiles (
  user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  prefecture   text,
  city         text,
  note         text            -- 事業概要 nullable
);

-- JA職員プロフィール
CREATE TABLE ja_profiles (
  user_id           uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  prefecture        text,
  city              text
);

-- 研究者プロフィール
CREATE TABLE researcher_profiles (
  user_id           uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  specialty         text
);

-- 製品
CREATE TABLE products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id              uuid NOT NULL REFERENCES users(id),
  product_type_id       uuid NOT NULL REFERENCES product_types(id),
  name                  text NOT NULL,
  general_purpose       text,
  primary_compound      text,
  mode_of_action        text,
  commercial_status     text,
  label_url             text,
  sds_url               text,
  -- v2仕込み（nullable）
  fertilizer_registered boolean,
  pesticide_registered  boolean,
  is_screened           boolean,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 第4層: 第3層に依存
-- ============================================================

-- 製品画像
CREATE TABLE product_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        text NOT NULL,
  "order"    int  NOT NULL DEFAULT 0
);

-- 製品×認証（中間）
CREATE TABLE product_certifications (
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, certification_id)
);

-- 製品×販売地域（中間）
CREATE TABLE product_prefectures (
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  prefecture_code text NOT NULL CHECK (prefecture_code ~ '^[0-9]{2}$'),
  PRIMARY KEY (product_id, prefecture_code)
);

-- 製品×JBSA効果タグ（中間）
CREATE TABLE product_benefit_relations (
  product_id         uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_benefit_id uuid NOT NULL REFERENCES product_benefits(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, product_benefit_id)
);

-- 製品×組成タイプ（中間）
CREATE TABLE product_composition_type_relations (
  product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  composition_type_id uuid NOT NULL REFERENCES product_composition_types(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, composition_type_id)
);

-- 製品×技術分類（中間）
CREATE TABLE product_science_technology_relations (
  product_id            uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  science_technology_id uuid NOT NULL REFERENCES product_science_technologies(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, science_technology_id)
);

-- 製品×施用方法（中間）
CREATE TABLE product_application_method_relations (
  product_id            uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  application_method_id uuid NOT NULL REFERENCES product_application_methods(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, application_method_id)
);

-- 製品×施用時期（中間）
CREATE TABLE product_application_window_relations (
  product_id             uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  application_window_id  uuid NOT NULL REFERENCES product_application_windows(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, application_window_id)
);

-- 製品×作目（中間）
CREATE TABLE product_crops (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  crop_id    uuid NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, crop_id)
);

-- ユーザー×作目（中間）
CREATE TABLE user_crops (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_id uuid NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, crop_id)
);

-- レビュー
CREATE TABLE reviews (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id),
  product_id uuid        NOT NULL REFERENCES products(id),
  rating     int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)  -- 1ユーザー×1製品=1レビュー
);

-- ============================================================
-- 第5層: 第4層に依存
-- ============================================================

-- レビュー×使用作目（中間）
CREATE TABLE review_crops (
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  crop_id   uuid NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, crop_id)
);

-- レビュー×JBSA効果タグ（中間）
CREATE TABLE review_benefit_relations (
  review_id          uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  product_benefit_id uuid NOT NULL REFERENCES product_benefits(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, product_benefit_id)
);

-- レビュー×気に入ったポイント（中間）
CREATE TABLE review_point_relations (
  review_id     uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  review_point_id uuid NOT NULL REFERENCES review_points(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, review_point_id)
);

-- レビュー×使用時期（中間）
CREATE TABLE review_period_relations (
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  PRIMARY KEY (review_id, period_id)
);

-- ============================================================
-- インデックス
-- ============================================================

-- 検索・集計でよく使うカラム
CREATE INDEX idx_products_maker_id         ON products(maker_id);
CREATE INDEX idx_products_product_type_id  ON products(product_type_id);
CREATE INDEX idx_reviews_user_id           ON reviews(user_id);
CREATE INDEX idx_reviews_product_id        ON reviews(product_id);
CREATE INDEX idx_reviews_rating            ON reviews(rating);
CREATE INDEX idx_crops_status              ON crops(status);
CREATE INDEX idx_product_benefits_category ON product_benefits(category);

-- 第2層 FK逆引き
CREATE INDEX idx_crop_categories_l2_l1_id  ON crop_categories_l2(crop_categories_l1_id);

-- 第3層 FK逆引き
CREATE INDEX idx_crops_crop_categories_l2_id ON crops(crop_categories_l2_id);
CREATE INDEX idx_crops_created_by            ON crops(created_by);

-- 第4層 中間テーブル「2番目のFKカラム」逆引き
-- （複合PKは1番目のカラムにしかインデックスが効かないため明示的に追加）
CREATE INDEX idx_product_certifications_certification_id
  ON product_certifications(certification_id);
CREATE INDEX idx_product_benefit_relations_benefit_id
  ON product_benefit_relations(product_benefit_id);
CREATE INDEX idx_product_composition_type_relations_type_id
  ON product_composition_type_relations(composition_type_id);
CREATE INDEX idx_product_science_technology_relations_tech_id
  ON product_science_technology_relations(science_technology_id);
CREATE INDEX idx_product_application_method_relations_method_id
  ON product_application_method_relations(application_method_id);
CREATE INDEX idx_product_application_window_relations_window_id
  ON product_application_window_relations(application_window_id);
CREATE INDEX idx_product_crops_crop_id
  ON product_crops(crop_id);
CREATE INDEX idx_user_crops_crop_id
  ON user_crops(crop_id);
CREATE INDEX idx_product_images_product_id
  ON product_images(product_id);

-- 第5層 中間テーブル「2番目のFKカラム」逆引き
CREATE INDEX idx_review_crops_crop_id
  ON review_crops(crop_id);
CREATE INDEX idx_review_benefit_relations_benefit_id
  ON review_benefit_relations(product_benefit_id);
CREATE INDEX idx_review_point_relations_point_id
  ON review_point_relations(review_point_id);
CREATE INDEX idx_review_period_relations_period_id
  ON review_period_relations(period_id);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- auth.users → public.users 自動同期トリガー
-- NOTE: Supabase でユーザー登録時に public.users にも INSERT
--       role と name はオンボーディング完了時に UPDATE する
--       SECURITY DEFINER + search_path 固定が Supabase 推奨
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, role, name)
  VALUES (
    NEW.id,
    'unassigned',          -- デフォルト（オンボーディングでロール選択後に更新）
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;  -- 冪等性確保（重複時もauth側を失敗させない）
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();