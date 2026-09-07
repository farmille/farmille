-- =============================================================================
-- 資材分類の正規化
-- 正: docs/rebuild/01-domain-model.md §3「分類（Farmille 所有）」
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 汎用タグを、悩み・栽培条件だけを扱う検索タグへ限定する
-- -----------------------------------------------------------------------------

alter table public.tags rename to search_tags;
alter table public.material_tags rename to material_search_tags;
alter table public.material_search_tags rename column tag_id to search_tag_id;

alter table public.search_tags rename constraint tags_pkey to search_tags_pkey;
alter table public.search_tags
  rename constraint tags_category_name_unique to search_tags_category_name_unique;
alter table public.material_search_tags
  rename constraint material_tags_pkey to material_search_tags_pkey;
alter table public.material_search_tags
  rename constraint material_tags_material_id_fkey to material_search_tags_material_id_fkey;
alter table public.material_search_tags
  rename constraint material_tags_tag_id_fkey to material_search_tags_search_tag_id_fkey;
alter table public.material_search_tags
  rename constraint material_tags_unique to material_search_tags_unique;

alter index public.material_tags_tag_id_idx
  rename to material_search_tags_search_tag_id_idx;

alter policy tags_select_all on public.search_tags rename to search_tags_select_all;
alter policy tags_insert_admin on public.search_tags rename to search_tags_insert_admin;
alter policy tags_update_admin on public.search_tags rename to search_tags_update_admin;
alter policy tags_delete_admin on public.search_tags rename to search_tags_delete_admin;
alter policy material_tags_select_all on public.material_search_tags
  rename to material_search_tags_select_all;
alter policy material_tags_insert_admin on public.material_search_tags
  rename to material_search_tags_insert_admin;
alter policy material_tags_update_admin on public.material_search_tags
  rename to material_search_tags_update_admin;
alter policy material_tags_delete_admin on public.material_search_tags
  rename to material_search_tags_delete_admin;

comment on table public.search_tags is
  '利用者向けの検索語。悩み・栽培条件だけを扱い、正規化した資材分類とは分離する。';
comment on table public.material_search_tags is
  '資材と検索タグの関連。分類・検索層のため Farmille のみ編集できる。';

-- -----------------------------------------------------------------------------
-- 2. 効果分類
-- -----------------------------------------------------------------------------

create table public.effect_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.effect_categories is
  '個別効果を束ねる上位分類。資材との直接関連は持たない。';

create table public.effects (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.effect_categories (id) on delete restrict,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint effects_category_name_unique unique (category_id, name)
);

create index effects_category_id_idx on public.effects (category_id, sort_order);

create table public.material_effects (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  effect_id uuid not null references public.effects (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_effects_unique unique (material_id, effect_id)
);

create index material_effects_effect_id_idx on public.material_effects (effect_id);

-- -----------------------------------------------------------------------------
-- 3. 対象作物
-- -----------------------------------------------------------------------------

create table public.material_crops (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  crop_id uuid not null references public.crops (id) on delete restrict,
  source_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_crops_source_name_not_blank check (btrim(source_name) <> ''),
  constraint material_crops_unique unique (material_id, crop_id)
);

comment on column public.material_crops.source_name is
  'メーカー資料に記載された個別作物名。正規化後の名称は crops.name を使う。';

create index material_crops_crop_id_idx on public.material_crops (crop_id);

-- -----------------------------------------------------------------------------
-- 4. 材料分類・組成タイプ・製品タイプ
-- -----------------------------------------------------------------------------

create table public.ingredient_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ingredient_categories is 'JBSA材料分類のマスタ。';

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.ingredient_categories (id) on delete restrict,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_category_name_unique unique (category_id, name)
);

create index ingredients_category_id_idx on public.ingredients (category_id, sort_order);

create table public.material_ingredient_categories (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  ingredient_category_id uuid not null references public.ingredient_categories (id)
    on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_ingredient_categories_unique
    unique (material_id, ingredient_category_id)
);

create index material_ingredient_categories_category_id_idx
  on public.material_ingredient_categories (ingredient_category_id);

create table public.material_ingredients (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_ingredients_unique unique (material_id, ingredient_id)
);

create index material_ingredients_ingredient_id_idx
  on public.material_ingredients (ingredient_id);

create table public.composition_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materials
  add column composition_type_id uuid
  references public.composition_types (id) on delete restrict;

create index materials_composition_type_id_idx
  on public.materials (composition_type_id);

create table public.product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.product_types is
  'メーカー資料に記載された製品タイプのマスタ。資材とは多対多で関連する。';

create table public.material_product_types (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  product_type_id uuid not null references public.product_types (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_product_types_unique unique (material_id, product_type_id)
);

create index material_product_types_product_type_id_idx
  on public.material_product_types (product_type_id);

-- 一次情報の主成分原文と、正規化した ingredients テーブルを名前でも区別する。
alter table public.materials rename column ingredients to main_components;

-- -----------------------------------------------------------------------------
-- 5. 公開デモに合わせた分類マスタの初期値
-- -----------------------------------------------------------------------------

insert into public.effect_categories (name, sort_order) values
  ('栄養利用の効率改善', 1),
  ('非生物的ストレス耐性の改善', 2),
  ('収量・品質の改善', 3),
  ('その他', 4);

insert into public.effects (category_id, name, sort_order)
select category.id, entries.name, entries.sort_order
from (
  values
    ('栄養利用の効率改善', '養分吸収の改善', 1),
    ('栄養利用の効率改善', '水分吸収の改善', 2),
    ('栄養利用の効率改善', '酸素の供給効率の改善', 3),
    ('栄養利用の効率改善', 'CO2の供給効率の改善', 4),
    ('栄養利用の効率改善', '養分の利用効率の改善', 5),
    ('非生物的ストレス耐性の改善', '耐暑性改善', 1),
    ('非生物的ストレス耐性の改善', '耐寒性改善', 2),
    ('非生物的ストレス耐性の改善', '耐乾燥性改善', 3),
    ('非生物的ストレス耐性の改善', '湿害からの回復改善', 4),
    ('非生物的ストレス耐性の改善', '低照度下での生育改善', 5),
    ('非生物的ストレス耐性の改善', '塩害耐性改善', 6),
    ('非生物的ストレス耐性の改善', '遮光効果', 7),
    ('非生物的ストレス耐性の改善', '耐霜性改善', 8),
    ('非生物的ストレス耐性の改善', '環境ストレス耐性を高める', 9),
    ('収量・品質の改善', '収量改善', 1),
    ('収量・品質の改善', '秀品率の改善', 2),
    ('収量・品質の改善', '有用成分（栄養成分・機能性成分）の改善', 3),
    ('収量・品質の改善', '糖度増加', 4),
    ('その他', '光合成改善', 1),
    ('その他', '細胞壁の強化', 2),
    ('その他', '樹勢改善', 3),
    ('その他', '成り疲れ改善', 4),
    ('その他', '外部損傷の修復', 5),
    ('その他', 'しおれ軽減', 6),
    ('その他', '根圏の有用微生物の活性化', 7)
) as entries (category_name, name, sort_order)
join public.effect_categories category on category.name = entries.category_name;

insert into public.ingredient_categories (name, sort_order) values
  ('海藻、海藻抽出物', 1),
  ('アミノ酸、ペプチド、タンパク質加水分解物', 2),
  ('微量ミネラル、ビタミン', 3);

insert into public.ingredients (category_id, name, sort_order)
select category.id, entries.name, entries.sort_order
from (
  values
    ('海藻、海藻抽出物', '海藻', 1),
    ('海藻、海藻抽出物', '海藻抽出物', 2),
    ('アミノ酸、ペプチド、タンパク質加水分解物', 'アミノ酸', 1),
    ('アミノ酸、ペプチド、タンパク質加水分解物', 'ペプチド', 2),
    ('アミノ酸、ペプチド、タンパク質加水分解物', 'タンパク質加水分解物', 3),
    ('微量ミネラル、ビタミン', '微量ミネラル', 1),
    ('微量ミネラル、ビタミン', 'ビタミン', 2)
) as entries (category_name, name, sort_order)
join public.ingredient_categories category on category.name = entries.category_name;

insert into public.composition_types (name, sort_order) values
  ('単一系', 1),
  ('混合系', 2);

insert into public.product_types (name, sort_order) values
  ('バイオスティミュラント', 1),
  ('微生物資材', 2),
  ('土壌改良材', 3),
  ('液体肥料', 4);

-- 公開デモで使う作物群を揃える。既存作物は意味が明確なものだけ移し替える。
update public.crop_groups
set name = 'あぶらな科野菜（花蕾及び茎）'
where name = 'あぶらな科野菜';

insert into public.crop_groups (name, sort_order) values
  ('茎野菜類', 9),
  ('豆類（種実）', 13),
  ('豆類（未成熟）', 14),
  ('果樹（その他）', 16),
  ('野菜（その他）', 17),
  ('花き類', 18),
  ('芝・緑化', 19),
  ('工芸作物', 20)
on conflict (name) do update set sort_order = excluded.sort_order;

update public.crop_groups as groups
set sort_order = entries.sort_order
from (
  values
    ('かんきつ類', 1),
    ('仁果類', 2),
    ('核果類', 3),
    ('ベリー類等の小粒果実類', 4),
    ('なす科果菜類', 5),
    ('うり類', 6),
    ('あぶらな科野菜（花蕾及び茎）', 7),
    ('葉菜類', 8),
    ('茎野菜類', 9),
    ('根菜類', 10),
    ('いも類', 11),
    ('鱗茎類', 12),
    ('豆類（種実）', 13),
    ('豆類（未成熟）', 14),
    ('穀類', 15),
    ('果樹（その他）', 16),
    ('野菜（その他）', 17),
    ('花き類', 18),
    ('芝・緑化', 19),
    ('工芸作物', 20)
) as entries (name, sort_order)
where groups.name = entries.name;

update public.crops
set group_id = (select id from public.crop_groups where name = '葉菜類')
where name in ('はくさい', 'ミニ白菜', 'キャベツ');

update public.crops
set group_id = (select id from public.crop_groups where name = '豆類（種実）')
where name = '大豆';

insert into public.crops (group_id, name, aliases, sort_order)
select groups.id, 'カリフラワー', '{}'::text[], 2
from public.crop_groups groups
where groups.name = 'あぶらな科野菜（花蕾及び茎）'
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- 6. 既存データの変換
-- -----------------------------------------------------------------------------

-- 既存の効果タグに新マスタと完全一致するものがあれば、効果関連へ移す。
insert into public.material_effects (material_id, effect_id)
select relations.material_id, effects.id
from public.material_search_tags relations
join public.search_tags tags on tags.id = relations.search_tag_id
join public.effects effects on effects.name = tags.name
where tags.category = 'effect'
on conflict (material_id, effect_id) do nothing;

-- 作物名が正規化作物と完全一致する既存タグは、対象作物関連へ移す。
insert into public.material_crops (material_id, crop_id, source_name, sort_order)
select relations.material_id, crops.id, tags.name, tags.sort_order
from public.material_search_tags relations
join public.search_tags tags on tags.id = relations.search_tag_id
join public.crops crops on crops.name = tags.name
where tags.category = 'crop'
on conflict (material_id, crop_id) do nothing;

-- 旧 materials.product_type と type タグを製品タイプへ変換する。
insert into public.product_types (name, sort_order)
select distinct btrim(parts.name), 100
from public.materials materials
cross join lateral regexp_split_to_table(coalesce(materials.product_type, ''), '[,、]')
  as parts (name)
where btrim(parts.name) <> ''
on conflict (name) do nothing;

insert into public.product_types (name, sort_order)
select tags.name, tags.sort_order
from public.search_tags tags
where tags.category = 'type'
on conflict (name) do nothing;

insert into public.material_product_types (material_id, product_type_id)
select materials.id, product_types.id
from public.materials materials
cross join lateral regexp_split_to_table(coalesce(materials.product_type, ''), '[,、]')
  as parts (name)
join public.product_types product_types on product_types.name = btrim(parts.name)
where btrim(parts.name) <> ''
on conflict (material_id, product_type_id) do nothing;

insert into public.material_product_types (material_id, product_type_id)
select relations.material_id, product_types.id
from public.material_search_tags relations
join public.search_tags tags on tags.id = relations.search_tag_id
join public.product_types product_types on product_types.name = tags.name
where tags.category = 'type'
on conflict (material_id, product_type_id) do nothing;

-- 旧 jbsa_class の値は分割せず、資料に記載された材料分類名として保持する。
insert into public.ingredient_categories (name, sort_order)
select distinct btrim(materials.jbsa_class), 100
from public.materials materials
where btrim(coalesce(materials.jbsa_class, '')) <> ''
on conflict (name) do nothing;

insert into public.material_ingredient_categories (material_id, ingredient_category_id)
select materials.id, categories.id
from public.materials materials
join public.ingredient_categories categories on categories.name = btrim(materials.jbsa_class)
where btrim(coalesce(materials.jbsa_class, '')) <> ''
on conflict (material_id, ingredient_category_id) do nothing;

-- 正規化先へ移した関連と旧タグを取り除く。
delete from public.material_search_tags relations
using public.search_tags tags
where relations.search_tag_id = tags.id
  and (
    tags.category = 'type'
    or (tags.category = 'crop' and exists (
      select 1 from public.crops crops where crops.name = tags.name
    ))
    or (tags.category = 'effect' and exists (
      select 1 from public.effects effects where effects.name = tags.name
    ))
  );

delete from public.search_tags tags
where tags.category = 'type'
   or (tags.category = 'crop' and exists (
     select 1 from public.crops crops where crops.name = tags.name
   ))
   or (tags.category = 'effect' and exists (
     select 1 from public.effects effects where effects.name = tags.name
   ));

-- 同名の移行先タグが既にある場合は、関連を既存タグへ寄せてから旧行を消す。
insert into public.material_search_tags (material_id, search_tag_id)
select relations.material_id, target.id
from public.material_search_tags relations
join public.search_tags source on source.id = relations.search_tag_id
join public.search_tags target
 on target.name = source.name
 and target.category = case
   when source.name = '葉面散布' then 'condition'
   when source.category = 'effect' then 'concern'
   when source.category = 'crop' then 'condition'
   else source.category
 end
where source.category in ('effect', 'crop')
on conflict (material_id, search_tag_id) do nothing;

delete from public.material_search_tags relations
using public.search_tags source
where relations.search_tag_id = source.id
  and source.category in ('effect', 'crop')
  and exists (
    select 1
    from public.search_tags target
    where target.name = source.name
      and target.category = case
        when source.name = '葉面散布' then 'condition'
        when source.category = 'effect' then 'concern'
        when source.category = 'crop' then 'condition'
        else source.category
      end
  );

delete from public.search_tags source
where source.category in ('effect', 'crop')
  and exists (
    select 1
    from public.search_tags target
    where target.name = source.name
      and target.category = case
        when source.name = '葉面散布' then 'condition'
        when source.category = 'effect' then 'concern'
        when source.category = 'crop' then 'condition'
        else source.category
      end
  );

update public.search_tags
set category = case
  when name = '葉面散布' then 'condition'
  when category = 'effect' then 'concern'
  when category = 'crop' then 'condition'
  else category
end
where category in ('effect', 'crop');

alter table public.search_tags drop constraint tags_category_check;
alter table public.search_tags
  add constraint search_tags_category_check
  check (category in ('concern', 'condition'));

-- 変換後は旧分類カラムを残さず、関連テーブルを唯一の正とする。
drop trigger enforce_material_column_scope on public.materials;
alter table public.materials drop column product_type;
alter table public.materials drop column jbsa_class;

create trigger enforce_material_column_scope
  before update on public.materials
  for each row
  execute function app.enforce_protected_columns(
    '{id,name,manufacturer_name,sales_status,composition_type_id,seller_id,review_count,avg_rating,control_plot_ratio,created_at}'
  );

-- -----------------------------------------------------------------------------
-- 7. RLS・テーブル権限
-- -----------------------------------------------------------------------------

alter table public.effect_categories enable row level security;
alter table public.effects enable row level security;
alter table public.material_effects enable row level security;
alter table public.material_crops enable row level security;
alter table public.ingredient_categories enable row level security;
alter table public.ingredients enable row level security;
alter table public.material_ingredient_categories enable row level security;
alter table public.material_ingredients enable row level security;
alter table public.composition_types enable row level security;
alter table public.product_types enable row level security;
alter table public.material_product_types enable row level security;

grant select on
  public.effect_categories,
  public.effects,
  public.material_effects,
  public.material_crops,
  public.ingredient_categories,
  public.ingredients,
  public.material_ingredient_categories,
  public.material_ingredients,
  public.composition_types,
  public.product_types,
  public.material_product_types
to anon, authenticated;

grant insert, update, delete on
  public.effect_categories,
  public.effects,
  public.material_effects,
  public.material_crops,
  public.ingredient_categories,
  public.ingredients,
  public.material_ingredient_categories,
  public.material_ingredients,
  public.composition_types,
  public.product_types,
  public.material_product_types
to authenticated;

grant select, insert, update, delete on
  public.effect_categories,
  public.effects,
  public.material_effects,
  public.material_crops,
  public.ingredient_categories,
  public.ingredients,
  public.material_ingredient_categories,
  public.material_ingredients,
  public.composition_types,
  public.product_types,
  public.material_product_types
to service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'effect_categories',
    'effects',
    'material_effects',
    'material_crops',
    'ingredient_categories',
    'ingredients',
    'material_ingredient_categories',
    'material_ingredients',
    'composition_types',
    'product_types',
    'material_product_types'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      table_name || '_select_all',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (app.is_admin_writer())',
      table_name || '_insert_admin',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (app.is_admin_writer()) with check (app.is_admin_writer())',
      table_name || '_update_admin',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (app.is_admin_writer())',
      table_name || '_delete_admin',
      table_name
    );
  end loop;
end;
$$;

select app.sync_updated_at_triggers();
