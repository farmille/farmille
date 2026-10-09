import * as v from "valibot";
import { containerType, sourceLinks, type CatalogSource, type SourceProduct } from "./source.ts";
import { MaterialFieldsSchema, type CatalogSnapshot } from "./snapshot.ts";
import { sourceTaxonomy } from "./taxonomy.ts";

export function desiredCatalog(
  source: CatalogSource,
  snapshot: CatalogSnapshot,
  productMap: ReadonlyMap<string, string>,
) {
  const taxonomy = sourceTaxonomy(source, snapshot);
  const { links, excluded } = sourceLinks(source);
  const grouped = new Map<string, SourceProduct[]>();
  for (const product of source.製品) {
    const id = productMap.get(product.product_id);
    if (!id) throw new Error(`UUIDの対応がありません：${product.product_id}`);
    const products = grouped.get(id) ?? [];
    products.push(product);
    grouped.set(id, products);
  }
  const materials = [...grouped].map(([id, products]) => {
    products.sort(
      (a, b) =>
        Number(a.非表示フラグ) - Number(b.非表示フラグ) || a.product_id.localeCompare(b.product_id),
    );
    const canonical = products[0];
    if (products.some((row) => row.情報掲載責任会社 !== canonical.情報掲載責任会社))
      throw new Error(`統合する製品のメーカーが一致しません：${id}`);
    const productIds = new Set(products.map((row) => row.product_id));
    const values = source.表示値
      .filter((row) => productIds.has(row.product_id) && row.状態 === "現行レビュー反映値")
      .sort((a, b) => a.表示順 - b.表示順 || a.value_id.localeCompare(b.value_id));
    const suffixes = new Map([
      ["PRD-000139", "（りんご向け）"],
      ["PRD-000140", "（みかん向け）"],
      ["PRD-000126", "（都府県限定品）"],
    ]);
    const materialLinks = products.flatMap((product) => links.get(product.product_id) ?? []);
    const uniqueLinks = new Map(materialLinks.map((link) => [link.url, link]));
    for (const link of materialLinks) {
      if (uniqueLinks.get(link.url)?.group_name !== link.group_name)
        throw new Error(`統合する資料の分類が異なります：${link.url}`);
    }
    const tagged = values.filter((row) => row.tag_id !== null);
    const relations = (field: string) =>
      [
        ...new Set(
          tagged
            .filter((row) => row.field_code === field)
            .map((row) => {
              const relatedId = row.tag_id ? taxonomy.ids.get(row.tag_id) : undefined;
              if (!relatedId) throw new Error(`分類IDがありません：${row.value_id}`);
              return relatedId;
            }),
        ),
      ].sort();
    const cropRelations = (level: "個別作目" | "群") => {
      const result = new Map<string, { id: string; source_name: string; sort_order: number }>();
      for (const row of tagged.filter((item) => item.field_code === "target_crop")) {
        const tag = source.タグマスター.find((item) => item.tag_id === row.tag_id);
        if (!tag || (tag.階層区分 === "個別作目") !== (level === "個別作目")) continue;
        const relatedId = taxonomy.ids.get(tag.tag_id);
        if (!relatedId) throw new Error(`作物IDがありません：${tag.tag_id}`);
        if (!result.has(relatedId))
          result.set(relatedId, {
            id: relatedId,
            source_name: row.確定表示値,
            sort_order: row.表示順,
          });
      }
      return [...result.values()].sort((a, b) => a.id.localeCompare(b.id));
    };
    const methods = new Map<string, { method: string; source_text: string; sort_order: number }>();
    for (const row of tagged.filter((item) => item.field_code === "application_method")) {
      const method = row.tag_id ? taxonomy.methods.get(row.tag_id) : undefined;
      if (!method) throw new Error(`施用方法がありません：${row.value_id}`);
      const previous = methods.get(method);
      if (!previous)
        methods.set(method, { method, source_text: row.確定表示値, sort_order: row.表示順 });
      else if (previous.source_text !== row.確定表示値)
        previous.source_text += `・${row.確定表示値}`;
    }
    const suffix = suffixes.get(canonical.product_id) ?? "";
    const fields = v.parse(MaterialFieldsSchema, {
      name: canonical.表示製品名.endsWith(suffix)
        ? canonical.表示製品名
        : canonical.表示製品名 + suffix,
      official_name: canonical.正式名称,
      name_reading: canonical.読み,
      manufacturer_name: canonical.情報掲載責任会社,
      container_type_id: containerType(canonical.容器形状),
      publication_status: products.some((row) => !row.非表示フラグ) ? "published" : "archived",
      main_components:
        [
          ...new Set(
            values
              .filter((row) => row.field_code === "main_ingredient")
              .map((row) => row.確定表示値),
          ),
        ].join("・") || null,
      aliases: [
        ...new Set(
          products.flatMap(
            (row) =>
              row.別名
                ?.split(" / ")
                .map((name) => name.trim())
                .filter(Boolean) ?? [],
          ),
        ),
      ].sort(),
      links: [...uniqueLinks.values()],
      crops: cropRelations("個別作目"),
      crop_groups: cropRelations("群"),
      effects: relations("expected_effect"),
      ingredient_categories: relations("material_category"),
      application_methods: [...methods.values()].sort((a, b) => a.method.localeCompare(b.method)),
    });
    return { id, fields, sourceIds: [...productIds] };
  });
  return { materials, taxonomy, excluded };
}
