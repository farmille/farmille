import * as v from "valibot";
import { catalogId, sha256, type CatalogSource } from "./source.ts";
import { desiredCatalog } from "./desired.ts";
import { FieldNameSchema, type CatalogSnapshot, type MaterialFields } from "./snapshot.ts";

const hash = v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/));
export const ResolutionsSchema = v.array(
  v.object({
    key: v.string(),
    currentHash: hash,
    sourceHash: hash,
    action: v.picklist(["keep_current", "take_source"]),
  }),
);
export type Resolution = v.InferOutput<typeof ResolutionsSchema>[number];
type CatalogValue =
  | MaterialFields[keyof MaterialFields]
  | CatalogSnapshot["crop_groups"][number]
  | CatalogSnapshot["crops"][number]
  | CatalogSnapshot["effects"][number]
  | CatalogSnapshot["ingredient_categories"][number];
export const valueHash = (value: CatalogValue) => sha256(JSON.stringify(value));
export type Conflict = {
  key: string;
  currentHash: string;
  sourceHash: string;
  current: CatalogValue;
  incoming: CatalogValue;
  reason: string;
};

export function compareField(
  baseHash: string | undefined,
  current: CatalogValue,
  incoming: CatalogValue,
): "keep_current" | "take_source" | "conflict" {
  const currentHash = valueHash(current);
  const incomingHash = valueHash(incoming);
  if (currentHash === incomingHash || currentHash === baseHash) return "take_source";
  if (incomingHash === baseHash) return "keep_current";
  return "conflict";
}

export function planCatalog(
  source: CatalogSource,
  snapshot: CatalogSnapshot,
  initialMap: ReadonlyMap<string, string>,
  resolutions: Resolution[],
) {
  const conflicts: Conflict[] = [];
  const appliedResolutions = new Set<string>();
  if (new Set(resolutions.map((row) => row.key)).size !== resolutions.length)
    throw new Error("解決指定が重複しています。");
  function choose(
    key: string,
    current: CatalogValue,
    incoming: CatalogValue,
    base?: string,
    blocked?: string,
  ) {
    const currentHash = valueHash(current);
    const sourceHash = valueHash(incoming);
    const resolution = resolutions.find((row) => row.key === key);
    if (resolution) {
      if (resolution.currentHash !== currentHash || resolution.sourceHash !== sourceHash)
        throw new Error(`解決指定が古くなっています：${key}`);
      appliedResolutions.add(key);
      if (resolution.action === "keep_current") return false;
      if (!blocked) return true;
    }
    const result = compareField(base, current, incoming);
    if (result === "keep_current") return false;
    if (!resolution && result === "take_source" && (!blocked || currentHash === sourceHash))
      return true;
    conflicts.push({
      key,
      currentHash,
      sourceHash,
      current,
      incoming,
      reason: blocked ?? "初回差分、または取り込み元と公開内容の両方が変更されています。",
    });
    return false;
  }
  const productMap = new Map(initialMap);
  for (const previous of snapshot.product_map) {
    const next = productMap.get(previous.source_product_id);
    if (!next || next === previous.material_id) continue;
    const material = snapshot.materials.find((row) => row.id === previous.material_id);
    const blocked =
      material && (material.protected_references > 0 || material.seller_id)
        ? "旧UUIDに投稿・資材オーナー権限・原稿などがあるため、対応先を変更できません。"
        : undefined;
    if (
      !choose(
        `identity/${previous.source_product_id}`,
        previous.material_id,
        next,
        undefined,
        blocked,
      )
    )
      productMap.set(previous.source_product_id, previous.material_id);
  }
  const retainedIds = new Set(productMap.values());
  const retired = snapshot.materials.filter(
    (material) =>
      !retainedIds.has(material.id) &&
      snapshot.product_map.some(
        (row) => row.material_id === material.id && productMap.has(row.source_product_id),
      ),
  );
  const desired = desiredCatalog(source, snapshot, productMap);
  const masters = {
    crop_groups: desired.taxonomy.crop_groups.filter((row) => {
      const old = snapshot.crop_groups.find((item) => item.id === row.id);
      return (
        !old || (valueHash(old) !== valueHash(row) && choose(`crop_groups/${row.id}`, old, row))
      );
    }),
    crops: desired.taxonomy.crops.filter((row) => {
      const old = snapshot.crops.find((item) => item.id === row.id);
      return !old || (valueHash(old) !== valueHash(row) && choose(`crops/${row.id}`, old, row));
    }),
    effects: desired.taxonomy.effects.filter((row) => {
      const old = snapshot.effects.find((item) => item.id === row.id);
      return !old || (valueHash(old) !== valueHash(row) && choose(`effects/${row.id}`, old, row));
    }),
    ingredient_categories: desired.taxonomy.ingredient_categories.filter((row) => {
      const old = snapshot.ingredient_categories.find((item) => item.id === row.id);
      return (
        !old ||
        (valueHash(old) !== valueHash(row) && choose(`ingredient_categories/${row.id}`, old, row))
      );
    }),
  };
  const materials = desired.materials.map((incoming) => {
    const existing = snapshot.materials.find((row) => row.id === incoming.id);
    const fields: MaterialFields = structuredClone(incoming.fields);
    const changed: v.InferOutput<typeof FieldNameSchema>[] = [];
    for (const field of FieldNameSchema.options) {
      const base = snapshot.baselines.find(
        (row) => row.material_id === incoming.id && row.field_name === field,
      )?.source_sha256;
      const useSource =
        !existing ||
        choose(
          `material/${incoming.id}/${field}`,
          existing.fields[field],
          incoming.fields[field],
          base,
          existing.working_version
            ? `メーカー原稿（${existing.working_version.status}）があるため変更できません。`
            : field === "manufacturer_name" &&
                (existing.seller_id || existing.manufacturer_verified_at)
              ? "資材オーナー権限またはメーカー確認記録があるため、メーカーの変更は運営の変更手続きで行ってください。"
              : undefined,
        );
      if (!useSource && existing) Object.assign(fields, { [field]: existing.fields[field] });
      if (!existing || valueHash(fields[field]) !== valueHash(existing.fields[field]))
        changed.push(field);
    }
    return { ...incoming, fields, sourceFields: incoming.fields, changed, existing };
  });
  for (const resolution of resolutions) {
    if (!appliedResolutions.has(resolution.key))
      throw new Error(`該当する差分がない解決指定です：${resolution.key}`);
  }
  const sourceHash = sha256(JSON.stringify(source));
  const planHash = sha256(
    JSON.stringify({
      contract: 1,
      sourceHash,
      guard: snapshot.guard,
      productMap: [...productMap].sort(([a], [b]) => a.localeCompare(b)),
      resolutions,
    }),
  );
  return {
    runId: catalogId(`run/${planHash}`),
    planHash,
    sourceHash,
    guard: snapshot.guard,
    materials,
    masters,
    productMap,
    retired,
    conflicts,
    excluded: desired.excluded,
  };
}
export type CatalogPlan = ReturnType<typeof planCatalog>;
