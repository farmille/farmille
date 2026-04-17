-- ============================================================
-- Farmille v1 RLS（Row Level Security）ポリシー
-- 作成日: 2026-04-15
-- 方針:
--   - ロール判定は auth.jwt() -> 'app_metadata' ->> 'role' を信頼
--   - public.users.role への JOIN は使わない（パフォーマンス劣化防止）
--   - BFF（Railway/FastAPI）が Supabase Admin API で app_metadata に書き込む前提
--   - 第一防御は BFF、RLS は第二防御
-- ============================================================

-- ============================================================
-- 第1層: マスタテーブル（全員 SELECT、書き込みは admin のみ）
-- ※ 書き込みは service_role キー経由のみ（RLSはバイパスされる）。
--   そのためポリシーは SELECT のみ定義する。
-- ============================================================

-- crop_categories_l1
ALTER TABLE crop_categories_l1 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crop_categories_l1_select_all" ON crop_categories_l1
  FOR SELECT TO anon, authenticated USING (true);

-- crop_categories_l2
ALTER TABLE crop_categories_l2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crop_categories_l2_select_all" ON crop_categories_l2
  FOR SELECT TO anon, authenticated USING (true);

-- product_types
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_types_select_all" ON product_types
  FOR SELECT TO anon, authenticated USING (true);

-- product_benefits
ALTER TABLE product_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_benefits_select_all" ON product_benefits
  FOR SELECT TO anon, authenticated USING (true);

-- product_composition_types
ALTER TABLE product_composition_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_composition_types_select_all" ON product_composition_types
  FOR SELECT TO anon, authenticated USING (true);

-- product_science_technologies
ALTER TABLE product_science_technologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_science_technologies_select_all" ON product_science_technologies
  FOR SELECT TO anon, authenticated USING (true);

-- product_application_methods
ALTER TABLE product_application_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_application_methods_select_all" ON product_application_methods
  FOR SELECT TO anon, authenticated USING (true);

-- product_application_windows
ALTER TABLE product_application_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_application_windows_select_all" ON product_application_windows
  FOR SELECT TO anon, authenticated USING (true);

-- certifications
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_select_all" ON certifications
  FOR SELECT TO anon, authenticated USING (true);

-- periods
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periods_select_all" ON periods
  FOR SELECT TO anon, authenticated USING (true);

-- review_points
ALTER TABLE review_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_points_select_all" ON review_points
  FOR SELECT TO anon, authenticated USING (true);


-- ============================================================
-- crops（申請フロー付き）
--   - SELECT: 全員（status問わず読める。フィルタはBFFで実施）
--   - INSERT: farmer のみ。status='pending' を強制
--   - UPDATE/DELETE: 不可（admin が Studio で手動操作）
-- ============================================================
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crops_select_all" ON crops
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "crops_insert_farmer" ON crops
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'farmer'
    AND status = 'pending'
    AND created_by = auth.uid()
  );


-- ============================================================
-- users
--   - SELECT/UPDATE: 自分のみ
--   - INSERT: trigger handle_new_user (SECURITY DEFINER) 経由のみ
--     → ポリシーを定義しない = 通常クライアントからは INSERT 不可
--   - DELETE: 不可（auth.users 削除時に CASCADE）
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_self" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_self" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- 各プロフィールテーブル（自分のみ全権、ロール一致を強制）
-- ============================================================

-- farmer_profiles
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farmer_profiles_select_self" ON farmer_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "farmer_profiles_insert_self" ON farmer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'farmer'
  );

CREATE POLICY "farmer_profiles_update_self" ON farmer_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "farmer_profiles_delete_self" ON farmer_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- maker_profiles
ALTER TABLE maker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maker_profiles_select_self" ON maker_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "maker_profiles_insert_self" ON maker_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'maker'
  );

CREATE POLICY "maker_profiles_update_self" ON maker_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "maker_profiles_delete_self" ON maker_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ja_profiles
ALTER TABLE ja_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ja_profiles_select_self" ON ja_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ja_profiles_insert_self" ON ja_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'ja_staff'
  );

CREATE POLICY "ja_profiles_update_self" ON ja_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ja_profiles_delete_self" ON ja_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- researcher_profiles
ALTER TABLE researcher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "researcher_profiles_select_self" ON researcher_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "researcher_profiles_insert_self" ON researcher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'researcher'
  );

CREATE POLICY "researcher_profiles_update_self" ON researcher_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "researcher_profiles_delete_self" ON researcher_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- products
--   - SELECT: 全員
--   - INSERT: maker のみ、maker_id=自分
--   - UPDATE/DELETE: 自分の製品のみ
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_all" ON products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "products_insert_maker" ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'maker'
    AND maker_id = auth.uid()
  );

CREATE POLICY "products_update_owner" ON products
  FOR UPDATE TO authenticated
  USING (maker_id = auth.uid())
  WITH CHECK (maker_id = auth.uid());

CREATE POLICY "products_delete_owner" ON products
  FOR DELETE TO authenticated
  USING (maker_id = auth.uid());


-- ============================================================
-- product_images（全員 SELECT、自分の製品のみ書き込み）
-- ============================================================
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_all" ON product_images
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "product_images_insert_owner" ON product_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
        AND products.maker_id = auth.uid()
    )
  );

CREATE POLICY "product_images_update_owner" ON product_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
        AND products.maker_id = auth.uid()
    )
  );

CREATE POLICY "product_images_delete_owner" ON product_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_images.product_id
        AND products.maker_id = auth.uid()
    )
  );


-- ============================================================
-- 製品関連 中間テーブル（全員 SELECT、自分の製品のみ書き込み）
-- ============================================================

-- product_certifications
ALTER TABLE product_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_certifications_select_all" ON product_certifications
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_certifications_insert_owner" ON product_certifications
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_certifications.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_certifications_delete_owner" ON product_certifications
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_certifications.product_id AND products.maker_id = auth.uid()));

-- product_prefectures
ALTER TABLE product_prefectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_prefectures_select_all" ON product_prefectures
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_prefectures_insert_owner" ON product_prefectures
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_prefectures.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_prefectures_delete_owner" ON product_prefectures
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_prefectures.product_id AND products.maker_id = auth.uid()));

-- product_benefit_relations
ALTER TABLE product_benefit_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_benefit_relations_select_all" ON product_benefit_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_benefit_relations_insert_owner" ON product_benefit_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_benefit_relations.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_benefit_relations_delete_owner" ON product_benefit_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_benefit_relations.product_id AND products.maker_id = auth.uid()));

-- product_composition_type_relations
ALTER TABLE product_composition_type_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_composition_type_relations_select_all" ON product_composition_type_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_composition_type_relations_insert_owner" ON product_composition_type_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_composition_type_relations.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_composition_type_relations_delete_owner" ON product_composition_type_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_composition_type_relations.product_id AND products.maker_id = auth.uid()));

-- product_science_technology_relations
ALTER TABLE product_science_technology_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_science_technology_relations_select_all" ON product_science_technology_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_science_technology_relations_insert_owner" ON product_science_technology_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_science_technology_relations.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_science_technology_relations_delete_owner" ON product_science_technology_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_science_technology_relations.product_id AND products.maker_id = auth.uid()));

-- product_application_method_relations
ALTER TABLE product_application_method_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_application_method_relations_select_all" ON product_application_method_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_application_method_relations_insert_owner" ON product_application_method_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_application_method_relations.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_application_method_relations_delete_owner" ON product_application_method_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_application_method_relations.product_id AND products.maker_id = auth.uid()));

-- product_application_window_relations
ALTER TABLE product_application_window_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_application_window_relations_select_all" ON product_application_window_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_application_window_relations_insert_owner" ON product_application_window_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_application_window_relations.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_application_window_relations_delete_owner" ON product_application_window_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_application_window_relations.product_id AND products.maker_id = auth.uid()));

-- product_crops
ALTER TABLE product_crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_crops_select_all" ON product_crops
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "product_crops_insert_owner" ON product_crops
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = product_crops.product_id AND products.maker_id = auth.uid()));
CREATE POLICY "product_crops_delete_owner" ON product_crops
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_crops.product_id AND products.maker_id = auth.uid()));


-- ============================================================
-- user_crops（自分のレコードのみ全権）
-- ============================================================
ALTER TABLE user_crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_crops_select_self" ON user_crops
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_crops_insert_self" ON user_crops
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_crops_delete_self" ON user_crops
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- reviews
--   - SELECT: 全員
--   - INSERT: farmer のみ、user_id=自分
--   - UPDATE/DELETE: 自分のレビューのみ
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "reviews_insert_farmer" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'farmer'
    AND user_id = auth.uid()
  );

CREATE POLICY "reviews_update_owner" ON reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reviews_delete_owner" ON reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- レビュー関連 中間テーブル（全員 SELECT、自分のレビューのみ書き込み）
-- ============================================================

-- review_crops
ALTER TABLE review_crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_crops_select_all" ON review_crops
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "review_crops_insert_owner" ON review_crops
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_crops.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "review_crops_delete_owner" ON review_crops
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_crops.review_id AND reviews.user_id = auth.uid()));

-- review_benefit_relations
ALTER TABLE review_benefit_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_benefit_relations_select_all" ON review_benefit_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "review_benefit_relations_insert_owner" ON review_benefit_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_benefit_relations.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "review_benefit_relations_delete_owner" ON review_benefit_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_benefit_relations.review_id AND reviews.user_id = auth.uid()));

-- review_point_relations
ALTER TABLE review_point_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_point_relations_select_all" ON review_point_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "review_point_relations_insert_owner" ON review_point_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_point_relations.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "review_point_relations_delete_owner" ON review_point_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_point_relations.review_id AND reviews.user_id = auth.uid()));

-- review_period_relations
ALTER TABLE review_period_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_period_relations_select_all" ON review_period_relations
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "review_period_relations_insert_owner" ON review_period_relations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_period_relations.review_id AND reviews.user_id = auth.uid()));
CREATE POLICY "review_period_relations_delete_owner" ON review_period_relations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_period_relations.review_id AND reviews.user_id = auth.uid()));