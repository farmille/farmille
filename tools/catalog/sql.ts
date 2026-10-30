import * as v from "valibot";
import { catalogId, type CatalogSource } from "./source.ts";
import { guardQuery, lockedTables, FieldNameSchema } from "./snapshot.ts";
import { valueHash, type CatalogPlan } from "./plan.ts";

type SqlValue = string | number | boolean | null;

const literal = (value: SqlValue): string =>
  value === null
    ? "null"
    : v.is(v.string(), value)
      ? `'${value.replaceAll("'", "''")}'`
      : String(value);

function insert(table: string, columns: string[], rows: SqlValue[][], conflict = ""): string {
  if (!rows.length) return "";

  return `insert into public.${table}(${columns.join(",")}) values\n${rows.map((row) => `(${row.map(literal).join(",")})`).join(",\n")} ${conflict};`;
}

function upsert(table: string, columns: string[], rows: SqlValue[][]) {
  return insert(
    table,
    columns,
    rows,
    `on conflict(${columns[0]}) do update set ${columns
      .slice(1)
      .map((column) => `${column}=excluded.${column}`)
      .join(",")}`,
  );
}

function materialSql(material: CatalogPlan["materials"][number], runId: string): string[] {
  const { id, fields, changed, existing } = material;
  const statements: string[] = [];

  if (!existing)
    statements.push(
      insert(
        "materials",
        ["id", "name", "manufacturer_name", "publication_status", "archived_at"],
        [[id, fields.name, fields.manufacturer_name, "published", null]],
      ),
    );

  const scalarFields = [
    "name",
    "official_name",
    "name_reading",
    "manufacturer_name",
    "container_type_id",
    "publication_status",
    "main_components",
  ];

  const assignments = changed
    .filter((field) => scalarFields.includes(field))
    .map((field) => {
      const value = fields[field];

      if (Array.isArray(value)) throw new Error(`単一値の項目ではありません：${field}`);

      return `${field}=${literal(value)}`;
    });

  if (changed.includes("publication_status"))
    assignments.push(`archived_at=${fields.publication_status === "archived" ? "now()" : "null"}`);

  if (assignments.length)
    statements.push(
      `update public.materials set ${assignments.join(",")} where id=${literal(id)};`,
    );

  const replace = (
    field: (typeof changed)[number],
    table: string,
    columns: string[],
    rows: SqlValue[][],
  ) => {
    if (!changed.includes(field)) return;
    statements.push(
      `delete from public.${table} where material_id=${literal(id)};`,
      insert(
        table,
        ["material_id", ...columns],
        rows.map((row) => [id, ...row]),
      ),
    );
  };

  replace(
    "aliases",
    "material_name_aliases",
    ["name"],
    fields.aliases.map((name) => [name]),
  );
  replace(
    "crops",
    "material_crops",
    ["crop_id", "source_name", "sort_order"],
    fields.crops.map((row) => [row.id, row.source_name, row.sort_order]),
  );
  replace(
    "crop_groups",
    "material_crop_groups",
    ["crop_group_id", "source_name", "sort_order"],
    fields.crop_groups.map((row) => [row.id, row.source_name, row.sort_order]),
  );
  replace(
    "effects",
    "material_effects",
    ["effect_id"],
    fields.effects.map((value) => [value]),
  );
  replace(
    "ingredient_categories",
    "material_ingredient_categories",
    ["ingredient_category_id"],
    fields.ingredient_categories.map((value) => [value]),
  );
  replace(
    "application_methods",
    "material_application_methods",
    ["method", "source_text", "sort_order"],
    fields.application_methods.map((row) => [row.method, row.source_text, row.sort_order]),
  );
  const needsVersion = changed.includes("links") || changed.includes("main_components");

  if (needsVersion) {
    const versionId = catalogId(`${runId}/${id}`);
    statements.push(`insert into public.material_page_versions(id,material_id,base_revision,status,description,main_components,mechanism,content_contract,origin,catalog_import_run_id)
      select ${literal(versionId)},m.id,m.content_revision,'published',coalesce(v.description,m.description,''),${literal(fields.main_components ?? "")},coalesce(v.mechanism,m.mechanism,''),coalesce(v.content_contract,2),'catalog',${literal(runId)}
      from public.materials m left join public.material_page_versions v on v.id=m.published_page_version_id where m.id=${literal(id)};`);

    for (const [table, columns] of [
      ["material_page_usages", "method,detail,sort_order"],
      ["material_page_timings", "timing"],
      ["material_page_certifications", "title,sort_order"],
      ["material_page_registrations", "kind,company_name,effects"],
      ["material_page_related_companies", "sort_order,company_name"],
    ]) {
      if (existing?.published_page_version_id)
        statements.push(
          `insert into public.${table}(version_id,${columns}) select ${literal(versionId)},${columns} from public.${table} where version_id=${literal(existing.published_page_version_id)};`,
        );
    }

    if (!existing?.published_page_version_id) {
      statements.push(
        insert(
          "material_page_related_companies",
          ["version_id", "sort_order", "company_name"],
          [[versionId, 0, fields.manufacturer_name]],
        ),
      );
      statements.push(
        `insert into public.material_page_usages(version_id,method,detail,sort_order) select ${literal(versionId)},'other',usage_text,0 from public.materials where id=${literal(id)} and nullif(btrim(usage_text),'') is not null;`,
      );
    }

    statements.push(
      insert(
        "material_page_links",
        [
          "version_id",
          "sort_order",
          "group_name",
          "title",
          "url",
          "trial_crops",
          "trial_summary",
          "trial_institution",
          "trial_year",
          "trial_page_count",
        ],
        fields.links.map((link, index) => {
          const trial = link.group_name === "public_trial" || link.group_name === "other_trial";

          return [
            versionId,
            index,
            link.group_name,
            link.title,
            link.url,
            trial ? link.trial_crops : null,
            trial ? link.trial_summary : null,
            trial ? link.trial_institution : null,
            link.trial_year,
            link.trial_page_count,
          ];
        }),
      ),
    );
    statements.push(
      `update public.materials set published_page_version_id=${literal(versionId)},content_revision=content_revision+1 where id=${literal(id)};`,
    );
  } else if (changed.length)
    statements.push(
      `update public.materials set content_revision=content_revision+1 where id=${literal(id)};`,
    );

  return statements;
}

export function applySql(plan: CatalogPlan, source: CatalogSource): string {
  if (plan.conflicts.length) throw new Error("未解決の差分があるため適用SQLを生成できません。");

  const statements = [
    `if exists(select 1 from public.catalog_import_runs where id=${literal(plan.runId)} and plan_sha256=${literal(plan.planHash)}) then return; end if;`,
    `if (${guardQuery})<>${literal(plan.guard)} then raise exception '計画後にデータが更新されています。スナップショットと計画を作り直してください。'; end if;`,
    insert(
      "catalog_import_runs",
      ["id", "source_sha256", "plan_sha256"],
      [[plan.runId, plan.sourceHash, plan.planHash]],
    ),
    upsert(
      "crop_groups",
      ["id", "name", "parent_id", "hierarchy_level", "sort_order", "is_active"],
      plan.masters.crop_groups.map((row) => [
        row.id,
        row.name,
        row.parent_id,
        row.hierarchy_level,
        row.sort_order,
        row.is_active,
      ]),
    ),
  ];

  for (const row of plan.masters.crops)
    statements.push(
      `insert into public.crops(id,name,group_id,aliases,sort_order,is_active) values(${literal(row.id)},${literal(row.name)},${literal(row.group_id)},array[${row.aliases.map(literal).join(",")}]::text[],${row.sort_order},${row.is_active}) on conflict(id) do update set name=excluded.name,group_id=excluded.group_id,aliases=excluded.aliases,sort_order=excluded.sort_order,is_active=excluded.is_active;`,
    );
  statements.push(
    upsert(
      "effects",
      ["id", "name", "sort_order", "category_id"],
      plan.masters.effects.map((row) => [row.id, row.name, row.sort_order, row.category_id]),
    ),
  );
  statements.push(
    upsert(
      "ingredient_categories",
      ["id", "name", "short_name", "sort_order"],
      plan.masters.ingredient_categories.map((row) => [
        row.id,
        row.name,
        row.short_name,
        row.sort_order,
      ]),
    ),
  );
  statements.push(
    insert(
      "manufacturers",
      ["name"],
      [...new Set(plan.materials.map((row) => row.fields.manufacturer_name))].map((name) => [name]),
      "on conflict(name) do nothing",
    ),
  );

  for (const material of plan.retired) {
    if (material.fields.publication_status !== "archived")
      statements.push(
        `update public.materials set publication_status='archived',archived_at=now(),content_revision=content_revision+1 where id=${literal(material.id)};`,
      );
  }

  for (const material of plan.materials) statements.push(...materialSql(material, plan.runId));
  statements.push(
    upsert(
      "catalog_source_products",
      ["source_product_id", "material_id", "source_name", "publication_decision"],
      source.製品.map((product) => {
        const id = plan.productMap.get(product.product_id);

        if (!id) throw new Error(`製品の対応がありません：${product.product_id}`);

        return [product.product_id, id, product.表示製品名, product.掲載判定];
      }),
    ),
  );
  const sources = new Map(source.出典.map((row) => [row.source_id, row]));
  statements.push(
    upsert(
      "catalog_source_evidence",
      [
        "evidence_id",
        "source_product_id",
        "field_code",
        "source_text",
        "source_url",
        "source_title",
      ],
      source.根拠原文.map((row) => {
        const citation = row.source_id ? sources.get(row.source_id) : undefined;

        return [
          row.evidence_id,
          row.product_id,
          row.field_code,
          row.原文,
          citation?.URL ?? null,
          citation?.資料名 ?? null,
        ];
      }),
    ),
  );
  statements.push(
    insert(
      "catalog_import_baselines",
      ["material_id", "field_name", "source_sha256", "run_id"],
      plan.materials.flatMap((material) =>
        FieldNameSchema.options.map((field) => [
          material.id,
          field,
          valueHash(material.sourceFields[field]),
          plan.runId,
        ]),
      ),
      "on conflict(material_id,field_name) do update set source_sha256=excluded.source_sha256,run_id=excluded.run_id",
    ),
  );
  const body = statements.filter(Boolean).join("\n");
  const delimiter = `$catalog_${plan.planHash}$`;

  if (body.includes(delimiter)) throw new Error("SQL区切り文字が資料内に含まれています。");

  return `begin;\nset local standard_conforming_strings=on;\nset local lock_timeout='5s';\nlock table ${lockedTables.map((table) => `public.${table}`).join(",")} in share row exclusive mode;\ndo ${delimiter} begin\n${body}\nend ${delimiter};\ncommit;\n`;
}
