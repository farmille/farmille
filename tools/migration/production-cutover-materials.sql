-- 原文と元の資材IDを保持し、レシピを用途欄へ集約する。
insert into public.materials (
  id, name, manufacturer_name, sales_status, description, general_use,
  main_components, mechanism, usage_text, created_at
)
select product.id, product.name, maker.company_name, product.commercial_status,
  product.expected_effects_official, product.general_purpose,
  product.primary_compound, product.mode_of_action,
  nullif(concat_ws(E'\n',
    case when nullif(product.usage_summary, '') is not null
      then '概要：' || product.usage_summary end,
    (
      select string_agg(
        '・作物：' || coalesce(nullif(recipe.crop_name, ''), nullif(recipe.crop_category, ''), '不明')
        || '／目的：' || coalesce(nullif(product.general_purpose, ''), '不明')
        || '／使い方：' || coalesce(nullif(concat_ws('、',
          '栽培：' || nullif(recipe.cultivation_type, ''),
          '方法：' || nullif(recipe.application_method, ''),
          '時期：' || nullif(recipe.application_timing, ''),
          '生育段階：' || nullif(recipe.growth_stage, ''),
          '希釈：' || nullif(recipe.dilution_rate, ''),
          '施用量：' || coalesce(nullif(recipe.dose_raw_text, ''),
            case when recipe.dose_amount is not null then concat_ws(' ',
              recipe.dose_amount::text, nullif(recipe.dose_unit, ''), nullif(recipe.dose_basis, '')) end),
          '散布液量：' || nullif(recipe.solution_amount, ''),
          '原液換算：' || nullif(recipe.original_liquid_equivalent, ''),
          '上限：' || nullif(recipe.max_dose_raw_text, ''),
          '補足：' || nullif(recipe.usage_notes, ''),
          '注意：' || nullif(recipe.precautions_specific, '')
        ), ''), '不明'), E'\n' order by recipe.sort_order, recipe.id
      ) from legacy_v1_20260908.product_application_recipes recipe
      where recipe.product_id = product.id
    )
  ), ''), product.created_at
from legacy_v1_20260908.products product
join legacy_v1_20260908.maker_profiles maker on maker.user_id = product.maker_id;

insert into public.product_types (name)
select name from legacy_v1_20260908.product_types
on conflict (name) do nothing;

insert into public.material_product_types (material_id, product_type_id)
select product.id, target_type.id
from legacy_v1_20260908.products product
join legacy_v1_20260908.product_types source_type on source_type.id = product.product_type_id
join public.product_types target_type on target_type.name = source_type.name;

insert into public.material_images (id, material_id, url, image_type, sort_order)
select id, product_id, url,
  case image_type when 'product_packaging' then 'package'
    when 'product_logo' then 'logo' when 'application_scene' then 'usage_scene'
    else image_type end,
  "order"
from legacy_v1_20260908.product_images;

do $$ begin
  if (select coalesce(sum(regexp_count(coalesce(usage_text, ''), '・作物：')), 0) from public.materials)
    <> (select count(*) from legacy_v1_20260908.product_application_recipes)
  then
    raise exception '施用レシピの移行件数が一致しません';
  end if;
end $$;
