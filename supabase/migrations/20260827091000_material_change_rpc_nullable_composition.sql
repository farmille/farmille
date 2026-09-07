-- Supabase の生成型で nullable な RPC 引数が string として出力されるため、
-- 未設定を空文字で受けて UUID へ正規化する公開ラッパーを置く。

create or replace function public.submit_material_create_change(
  p_name text,
  p_composition_type_id text,
  p_sales_status text,
  p_description text,
  p_general_use text,
  p_main_components text,
  p_mechanism text,
  p_usage_text text,
  p_price_range text,
  p_official_url text,
  p_catalog_url text,
  p_crop_ids uuid[],
  p_effect_ids uuid[],
  p_ingredient_category_ids uuid[],
  p_ingredient_ids uuid[],
  p_product_type_ids uuid[],
  p_search_tag_ids uuid[],
  p_reason text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select public.submit_material_create_request(
    p_name,
    nullif(btrim(p_composition_type_id), '')::uuid,
    p_sales_status,
    p_description,
    p_general_use,
    p_main_components,
    p_mechanism,
    p_usage_text,
    p_price_range,
    p_official_url,
    p_catalog_url,
    p_crop_ids,
    p_effect_ids,
    p_ingredient_category_ids,
    p_ingredient_ids,
    p_product_type_ids,
    p_search_tag_ids,
    p_reason
  );
$$;

create or replace function public.submit_material_update_change(
  p_material_id uuid,
  p_name text,
  p_composition_type_id text,
  p_sales_status text,
  p_description text,
  p_general_use text,
  p_main_components text,
  p_mechanism text,
  p_usage_text text,
  p_price_range text,
  p_official_url text,
  p_catalog_url text,
  p_crop_ids uuid[],
  p_effect_ids uuid[],
  p_ingredient_category_ids uuid[],
  p_ingredient_ids uuid[],
  p_product_type_ids uuid[],
  p_search_tag_ids uuid[],
  p_reason text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select public.submit_material_update_request(
    p_material_id,
    p_name,
    nullif(btrim(p_composition_type_id), '')::uuid,
    p_sales_status,
    p_description,
    p_general_use,
    p_main_components,
    p_mechanism,
    p_usage_text,
    p_price_range,
    p_official_url,
    p_catalog_url,
    p_crop_ids,
    p_effect_ids,
    p_ingredient_category_ids,
    p_ingredient_ids,
    p_product_type_ids,
    p_search_tag_ids,
    p_reason
  );
$$;

revoke all on function public.submit_material_create_change(
  text, text, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) from public;
revoke all on function public.submit_material_update_change(
  uuid, text, text, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) from public;

grant execute on function public.submit_material_create_change(
  text, text, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) to authenticated;
grant execute on function public.submit_material_update_change(
  uuid, text, text, text, text, text, text, text, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], uuid[], uuid[], text
) to authenticated;
