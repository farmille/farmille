import { APPLICATION_METHODS } from "../../src/lib/material-page-editor.ts";
import { catalogId, type CatalogSource } from "./source.ts";
import type { CatalogSnapshot } from "./snapshot.ts";

/**
 * 元データのタグ名のうち、括弧の中が別名（言い換え・読み・外来名）になっている作目。
 * チップや一覧に長い名前を出さないよう、括弧の前を名前にし、括弧の中を同義語へ移す。
 * 切花・球根・品種のように区別に要る括弧と、括弧を外すと既存の作目と同名になるものは含めない。
 */
const CROP_NAMES_WITH_ALIAS = new Set([
  "アマニ（亜麻仁）",
  "イグサ（い草）",
  "エンバク（オーツ麦）",
  "コンニャク（こんにゃくいも）",
  "サルシファイ（西洋ごぼう）",
  "ターメリック（ウコン）",
  "テンサイ（ビート）",
  "ナタネ（菜種）",
  "なばな（菜の花）",
  "ニガウリ（ゴーヤ）",
  "ハツカダイコン（ラディッシュ）",
  "ヒヨコマメ（ガルバンゾ）",
  "フダンソウ（スイスチャード）",
  "ベニバナ（紅花）",
  "ホースラディッシュ（西洋わさび）",
  "モロコシ（ソルガム）",
  "ライ小麦（トリティケール）",
  "中玉トマト（ミディトマト）",
  "白瓜（しろうり）",
  "胡蝶蘭（ファレノプシス）",
]);

type CropNameParts = { name: string; aliasInName: string | null };

function splitCropAlias(tagName: string): CropNameParts {
  if (!CROP_NAMES_WITH_ALIAS.has(tagName)) return { name: tagName, aliasInName: null };
  const match = /^(.+)（(.+)）$/.exec(tagName);

  if (match === null) throw new Error(`別名を分けられない作目名です：${tagName}`);

  return { name: match[1], aliasInName: match[2] };
}

export function sourceTaxonomy(source: CatalogSource, snapshot: CatalogSnapshot) {
  const ids = new Map<string, string>();
  const groups: CatalogSnapshot["crop_groups"] = [];

  for (const level of ["大分類", "中分類"]) {
    for (const tag of source.タグマスター.filter(
      (row) => row.field_code === "target_crop" && row.階層区分 === level,
    )) {
      const parent = tag.親tag_id ? ids.get(tag.親tag_id) : null;

      if (parent === undefined) throw new Error(`作物群の親がありません：${tag.tag_id}`);

      const matches = snapshot.crop_groups.filter(
        (row) =>
          row.id === catalogId(tag.tag_id) ||
          (row.name === tag.タグ名 && (row.parent_id === parent || row.parent_id === null)),
      );

      if (matches.length > 1) throw new Error(`作物群の対応を一意に決定できません：${tag.tag_id}`);
      const id = matches[0]?.id ?? catalogId(tag.tag_id);
      ids.set(tag.tag_id, id);
      groups.push({
        id,
        name: tag.タグ名,
        parent_id: parent,
        hierarchy_level: level === "大分類" ? "major" : "middle",
        sort_order: tag.表示順,
        is_active: true,
      });
    }
  }

  const crops: CatalogSnapshot["crops"] = [];

  for (const tag of source.タグマスター.filter(
    (row) => row.field_code === "target_crop" && row.階層区分 === "個別作目",
  )) {
    const parent = tag.親tag_id ? ids.get(tag.親tag_id) : undefined;

    if (!parent) throw new Error(`個別作目の親がありません：${tag.tag_id}`);
    const { name, aliasInName } = splitCropAlias(tag.タグ名);

    const matches = snapshot.crops.filter(
      (row) =>
        row.id === catalogId(tag.tag_id) ||
        ((row.name === name || row.name === tag.タグ名) && row.group_id === parent),
    );

    if (matches.length > 1) throw new Error(`個別作目の対応を一意に決定できません：${tag.tag_id}`);
    const id = matches[0]?.id ?? catalogId(tag.tag_id);
    ids.set(tag.tag_id, id);

    const synonyms =
      tag.同義語
        ?.split(/[、;；]/)
        .map((synonym) => synonym.trim())
        .filter(Boolean) ?? [];

    crops.push({
      id,
      name,
      group_id: parent,
      aliases: [...new Set([...(aliasInName === null ? [] : [aliasInName]), ...synonyms])],
      sort_order: tag.表示順,
      is_active: true,
    });
  }

  const effects: CatalogSnapshot["effects"] = [];
  const categories: CatalogSnapshot["ingredient_categories"] = [];
  const methods = new Map<string, (typeof APPLICATION_METHODS)[number]["value"]>();

  for (const tag of source.タグマスター) {
    if (tag.field_code === "expected_effect") {
      const matches = snapshot.effects.filter(
        (row) => row.name.replaceAll("CO₂", "CO2") === tag.タグ名.replaceAll("CO₂", "CO2"),
      );

      if (matches.length !== 1)
        throw new Error(`効果マスタとの対応を確認してください：${tag.タグ名}`);
      const existing = matches[0];
      ids.set(tag.tag_id, existing.id);
      effects.push({ ...existing, name: tag.タグ名, sort_order: tag.表示順 });
    } else if (tag.field_code === "material_category") {
      const matches = snapshot.ingredient_categories.filter(
        (row) =>
          row.name === tag.タグ名 ||
          (tag.タグ名 === "その他" && row.name === "その他（素性・由来が分かるように明記）"),
      );

      const existing = matches[0];

      if (!existing || matches.length > 1)
        throw new Error(`資材ジャンルの対応を確認してください：${tag.タグ名}`);
      ids.set(tag.tag_id, existing.id);
      categories.push({ ...existing, name: tag.タグ名, sort_order: tag.表示順 });
    } else if (tag.field_code === "application_method") {
      const method = APPLICATION_METHODS.find((row) => row.label === tag.タグ名);

      if (!method) throw new Error(`施用方法の対応を確認してください：${tag.タグ名}`);
      methods.set(tag.tag_id, method.value);
    }
  }

  const activeGroups = new Set(groups.map((row) => row.id));
  const activeCrops = new Set(crops.map((row) => row.id));
  groups.push(
    ...snapshot.crop_groups
      .filter((row) => !activeGroups.has(row.id))
      .map((row) => ({ ...row, is_active: false })),
  );
  crops.push(
    ...snapshot.crops
      .filter((row) => !activeCrops.has(row.id))
      .map((row) => ({ ...row, is_active: false })),
  );

  return { ids, methods, crop_groups: groups, crops, effects, ingredient_categories: categories };
}
