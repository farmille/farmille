-- 旧マスタの分類と出典を名称で照合し、新しい資材へ関連付ける。
insert into public.crop_groups (name)
select name from legacy_v1_20260908.crop_categories_l2
on conflict (name) do nothing;

insert into public.crops (name, group_id)
select crop.name, target_group.id
from legacy_v1_20260908.crops crop
join legacy_v1_20260908.crop_categories_l2 source_group
  on source_group.id = crop.crop_categories_l2_id
join public.crop_groups target_group on target_group.name = source_group.name
on conflict (name) do nothing;

insert into public.material_crops (material_id, crop_id, source_name)
select material.id, target_crop.id, source_crop.name
from legacy_v1_20260908.product_crops relation
join legacy_v1_20260908.products product on product.id = relation.product_id
join legacy_v1_20260908.maker_profiles maker on maker.user_id = product.maker_id
join public.materials material
  on material.name = product.name and material.manufacturer_name = maker.company_name
join legacy_v1_20260908.crops source_crop on source_crop.id = relation.crop_id
join public.crops target_crop on target_crop.name = source_crop.name
on conflict (material_id, crop_id) do nothing;

insert into public.material_effects (material_id, effect_id)
select material.id, effect.id
from legacy_v1_20260908.product_benefit_relations relation
join legacy_v1_20260908.products product on product.id = relation.product_id
join legacy_v1_20260908.maker_profiles maker on maker.user_id = product.maker_id
join public.materials material
  on material.name = product.name and material.manufacturer_name = maker.company_name
join legacy_v1_20260908.product_benefits benefit on benefit.id = relation.product_benefit_id
join public.effects effect on effect.name = benefit.name
on conflict (material_id, effect_id) do nothing;

insert into public.material_sources (id, material_id, source_url, source_type, note, created_at)
select source.id, material.id, source.url, source.source_type,
  concat_ws(E'\n', source.title, source.notes), source.created_at
from legacy_v1_20260908.product_sources source
join legacy_v1_20260908.products product on product.id = source.product_id
join legacy_v1_20260908.maker_profiles maker on maker.user_id = product.maker_id
join public.materials material
  on material.name = product.name and material.manufacturer_name = maker.company_name;

-- 件数不一致や対応漏れがあれば、スキーマ切替を含めて取り消す。
do $$ begin
  if (select count(*) from public.materials) <> (select count(*) from legacy_v1_20260908.products)
    or (select count(*) from public.material_images) <> (select count(*) from legacy_v1_20260908.product_images)
    or (select count(*) from public.material_sources) <> (select count(*) from legacy_v1_20260908.product_sources)
    or (select count(*) from public.material_crops) <> (select count(*) from legacy_v1_20260908.product_crops)
    or (select count(*) from public.material_effects) <> (select count(*) from legacy_v1_20260908.product_benefit_relations)
  then
    raise exception '資材マスタの移行件数が一致しません';
  end if;
  if exists (
    select 1 from legacy_v1_20260908.products product
    join legacy_v1_20260908.maker_profiles maker on maker.user_id = product.maker_id
    left join public.materials material
      on material.name = product.name and material.manufacturer_name = maker.company_name
    where material.id is null
      or material.description is distinct from product.expected_effects_official
      or material.general_use is distinct from product.general_purpose
      or material.main_components is distinct from product.primary_compound
      or material.mechanism is distinct from product.mode_of_action
  ) then
    raise exception '資材の一次情報が移行元と一致しません';
  end if;
end $$;
