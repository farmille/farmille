import * as v from "valibot";
import { LinkSchema } from "./source.ts";

const id = v.pipe(v.string(), v.uuid());
const text = v.nullable(v.string());
const crop = v.object({ id, source_name: v.string(), sort_order: v.number() });
export const MaterialFieldsSchema = v.object({
  name: v.string(),
  official_name: text,
  name_reading: text,
  manufacturer_name: v.string(),
  container_type_id: v.nullable(v.number()),
  publication_status: v.picklist(["published", "archived"]),
  main_components: text,
  aliases: v.array(v.string()),
  links: v.array(LinkSchema),
  crops: v.array(crop),
  crop_groups: v.array(crop),
  effects: v.array(id),
  ingredient_categories: v.array(id),
  application_methods: v.array(
    v.object({
      method: v.picklist(["spray", "drench", "mix", "soak", "coat", "other"]),
      source_text: v.string(),
      sort_order: v.number(),
    }),
  ),
});
export type MaterialFields = v.InferOutput<typeof MaterialFieldsSchema>;
export const FieldNameSchema = v.keyof(MaterialFieldsSchema);
export type FieldName = v.InferOutput<typeof FieldNameSchema>;
export const SnapshotSchema = v.object({
  guard: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
  materials: v.array(
    v.object({
      id,
      fields: MaterialFieldsSchema,
      published_page_version_id: v.nullable(id),
      content_revision: v.number(),
      seller_id: v.nullable(id),
      manufacturer_verified_at: text,
      protected_references: v.number(),
      working_version: v.nullable(v.object({ id, status: v.string(), base_revision: v.number() })),
    }),
  ),
  product_map: v.array(v.object({ source_product_id: v.string(), material_id: id })),
  baselines: v.array(
    v.object({ material_id: id, field_name: FieldNameSchema, source_sha256: v.string() }),
  ),
  crop_groups: v.array(
    v.object({
      id,
      name: v.string(),
      parent_id: v.nullable(id),
      hierarchy_level: v.picklist(["major", "middle"]),
      sort_order: v.number(),
      is_active: v.boolean(),
    }),
  ),
  crops: v.array(
    v.object({
      id,
      name: v.string(),
      group_id: id,
      aliases: v.array(v.string()),
      sort_order: v.number(),
      is_active: v.boolean(),
    }),
  ),
  effects: v.array(v.object({ id, name: v.string(), sort_order: v.number(), category_id: id })),
  ingredient_categories: v.array(
    v.object({ id, name: v.string(), short_name: v.string(), sort_order: v.number() }),
  ),
});
export type CatalogSnapshot = v.InferOutput<typeof SnapshotSchema>;
export type LiveMaterial = CatalogSnapshot["materials"][number];

export const lockedTables = [
  "materials",
  "manufacturers",
  "material_page_versions",
  "material_editor_grants",
  "material_name_aliases",
  "material_crops",
  "material_crop_groups",
  "material_effects",
  "material_ingredient_categories",
  "material_application_methods",
  "material_page_links",
  "material_page_usages",
  "material_page_timings",
  "material_page_certifications",
  "material_page_registrations",
  "material_page_related_companies",
  "material_page_images",
  "material_page_existing_images",
  "material_evidences",
  "material_images",
  "crop_groups",
  "crops",
  "effects",
  "ingredient_categories",
  "catalog_source_products",
  "catalog_source_evidence",
  "catalog_import_runs",
  "catalog_import_baselines",
  "reviews",
  "usage_reports",
  "saved_materials",
  "article_materials",
  "questions",
  "company_application_items",
  "material_change_requests",
  "material_editor_legacy_links",
  "material_page_audits",
];

export const guardQuery = `select encode(sha256(convert_to(jsonb_build_array(
${lockedTables.map((table) => `(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.${table} t)`).join(",\n")}
)::text,'UTF8')),'hex')`;

const trialColumns =
  "'trial_crops',coalesce(l.trial_crops,''),'trial_summary',coalesce(l.trial_summary,''),'trial_institution',coalesce(l.trial_institution,''),'trial_year',l.trial_year,'trial_page_count',l.trial_page_count";
const aggregate = (query: string) =>
  `(select coalesce(jsonb_agg(to_jsonb(items)),'[]'::jsonb) from (${query}) items)`;
const protectedReferences = [
  ["reviews", "material_id"],
  ["usage_reports", "material_id"],
  ["saved_materials", "material_id"],
  ["article_materials", "material_id"],
  ["questions", "material_id"],
  ["company_application_items", "material_id"],
  ["material_change_requests", "material_id"],
  ["material_change_requests", "result_material_id"],
  ["material_editor_grants", "material_id"],
  ["material_editor_legacy_links", "material_id"],
  ["material_page_versions", "material_id"],
  ["material_page_audits", "material_id"],
];
export const snapshotQuery = `select jsonb_build_object(
'guard',(${guardQuery}),
'materials',(select coalesce(jsonb_agg(jsonb_build_object(
  'id',m.id,'published_page_version_id',m.published_page_version_id,'content_revision',m.content_revision,'seller_id',m.seller_id,'manufacturer_verified_at',m.manufacturer_verified_at,
  'protected_references',${protectedReferences.map(([table, column]) => `(select count(*) from public.${table} r where r.${column}=m.id)`).join("+")},
  'working_version',(select jsonb_build_object('id',w.id,'status',w.status,'base_revision',w.base_revision)
    from public.material_page_versions w where w.material_id=m.id and w.origin='manufacturer'
    and (w.status in ('draft','pending') or (w.status='returned' and w.base_revision=m.content_revision))
    and not exists(select 1 from public.material_page_versions newer where newer.material_id=m.id and newer.origin='manufacturer' and newer.created_at>w.created_at)
    order by w.created_at desc limit 1),
  'fields',jsonb_build_object(
    'name',m.name,'official_name',m.official_name,'name_reading',m.name_reading,'manufacturer_name',m.manufacturer_name,
    'container_type_id',m.container_type_id,'publication_status',m.publication_status,'main_components',m.main_components,
    'aliases',(select coalesce(jsonb_agg(a.name order by a.name collate "C"),'[]'::jsonb) from public.material_name_aliases a where a.material_id=m.id),
    'links',case when m.published_page_version_id is not null then
      (select coalesce(jsonb_agg(jsonb_build_object('group_name',l.group_name,'title',l.title,'url',l.url,${trialColumns}) order by l.sort_order),'[]'::jsonb)
        from public.material_page_links l where l.version_id=m.published_page_version_id)
      else ${aggregate(`select distinct on (url) group_name,title,url,''::text trial_crops,''::text trial_summary,''::text trial_institution,null::integer trial_year,null::integer trial_page_count from (
        select 'overview'::text group_name,'メーカー公式ページ'::text title,m.official_url url where m.official_url is not null
        union all select 'overview','カタログ',m.catalog_url where m.catalog_url is not null
        union all select case e.evidence_type when 'sds' then 'safety' when 'leaflet' then 'overview' else 'technical' end,e.title,coalesce(e.external_url,e.file_url)
          from public.material_evidences e where e.material_id=m.id and coalesce(e.external_url,e.file_url) is not null
      ) legacy order by url,title`)} end,
    'crops',${aggregate("select crop_id id,source_name,sort_order from public.material_crops where material_id=m.id order by crop_id")},
    'crop_groups',${aggregate("select crop_group_id id,source_name,sort_order from public.material_crop_groups where material_id=m.id order by crop_group_id")},
    'effects',(select coalesce(jsonb_agg(effect_id order by effect_id),'[]'::jsonb) from public.material_effects where material_id=m.id),
    'ingredient_categories',(select coalesce(jsonb_agg(ingredient_category_id order by ingredient_category_id),'[]'::jsonb) from public.material_ingredient_categories where material_id=m.id),
    'application_methods',${aggregate("select method,source_text,sort_order from public.material_application_methods where material_id=m.id order by method")}
  )) order by m.id),'[]'::jsonb) from public.materials m),
'product_map',${aggregate("select source_product_id,material_id from public.catalog_source_products order by source_product_id")},
'baselines',${aggregate("select material_id,field_name,source_sha256 from public.catalog_import_baselines order by material_id,field_name")},
'crop_groups',${aggregate("select id,name,parent_id,hierarchy_level,sort_order,is_active from public.crop_groups order by id")},
'crops',${aggregate("select id,name,group_id,aliases,sort_order,is_active from public.crops order by id")},
'effects',${aggregate("select id,name,sort_order,category_id from public.effects order by id")},
'ingredient_categories',${aggregate("select id,name,short_name,sort_order from public.ingredient_categories order by id")}
)`;
