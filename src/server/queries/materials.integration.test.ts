import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { matchSearchCatalog, type SearchCatalog } from "@/lib/material-search";

import { listClassificationOptionsWithSupabase } from "@/server/queries/classifications";
import {
  getMaterialWithSupabase,
  listMaterialsWithSupabase,
  listRelatedMaterialsWithSupabase,
  withPostingMaterialImagesWithSupabase,
} from "@/server/queries/materials";
import type { Database } from "@/types/database.types";

const localSupabaseUrl = process.env.SUPABASE_LOCAL_URL;

function createLocalClient() {
  const localPublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (localSupabaseUrl === undefined) {
    throw new Error("SUPABASE_LOCAL_URL が設定されていません。");
  }

  if (localPublishableKey === undefined || localPublishableKey.length === 0) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません。");
  }

  return createClient<Database>(localSupabaseUrl, localPublishableKey);
}

describe.skipIf(localSupabaseUrl === undefined)("listMaterials 統合", () => {
  it("悩みタグの同義語と対応する効果を公開クライアントから取得できる", async () => {
    const result = await listClassificationOptionsWithSupabase(createLocalClient());
    if (!result.ok) throw new Error("分類マスタを取得できませんでした。");
    const search: SearchCatalog = {
      filters: result.data.searchTags
        .filter((tag) => tag.category === "concern")
        .map((tag) => ({ ...tag, category: "concern" })),
      makers: [],
      materials: [],
    };
    for (const { query, effects } of [
      { query: "水分不足", effects: ["耐乾燥性改善"] },
      { query: "暑さ対策", effects: ["耐暑性改善"] },
      { query: "高温耐性", effects: ["耐暑性改善"] },
      { query: "糖度が低い", effects: ["糖度増加"] },
      { query: "光合成が弱い", effects: ["光合成改善"] },
      { query: "収量低下", effects: ["収量改善"] },
      { query: "養分吸収量", effects: ["養分吸収の改善"] },
      { query: "水分の吸収効率", effects: ["水分吸収の改善"] },
      { query: "霜", effects: ["耐霜性改善"] },
      { query: "凍霜害", effects: [] },
      { query: "根腐れ", effects: [] },
      { query: "白未熟粒", effects: [] },
      { query: "病害虫", effects: [] },
    ]) {
      const matches = matchSearchCatalog(search, query);
      const effectIds = new Set(
        result.data.searchTags
          .filter((tag) => matches.filters.some((filter) => filter.id === tag.id))
          .flatMap((tag) => tag.effectIds),
      );
      expect(
        result.data.effects
          .filter((effect) => effectIds.has(effect.id))
          .map((effect) => effect.name),
        query,
      ).toEqual(expect.arrayContaining(effects));
      expect(effectIds.size, query).toBe(effects.length);
    }
    const climate = result.data.searchTags.find((tag) => tag.aliases.includes("気象変動"));
    const environment = result.data.effects.find(
      (effect) => effect.name === "環境ストレス耐性を高める",
    );
    expect(environment).toBeDefined();
    expect(climate?.effectIds).toContain(environment?.id);
  });

  it("ローカルDBから公開資材一覧を取得できる", async () => {
    const localClient = createLocalClient();
    const result = await listMaterialsWithSupabase(localClient, { page: 1 });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.page).toBe(1);
      expect(result.data.total).toBeGreaterThanOrEqual(0);

      const firstMaterial = result.data.items[0];

      if (firstMaterial !== undefined) {
        const options = await listClassificationOptionsWithSupabase(localClient);
        if (!options.ok) throw new Error("分類マスタを取得できませんでした。");
        const detail = await getMaterialWithSupabase(localClient, firstMaterial.id, options.data);

        expect(detail.ok).toBe(true);
      }
    }
  }, 20_000);

  it("資材ジャンルを共有する資材が多くても、関連資材を口コミの多い順に返す", async () => {
    const client = createLocalClient();
    const [published, genres] = await Promise.all([
      client.from("materials").select("id, review_count").eq("publication_status", "published"),
      client.from("ingredient_categories").select("id"),
    ]);
    if (published.error !== null) throw published.error;
    if (genres.error !== null) throw genres.error;
    const members = await Promise.all(
      genres.data.map(async (genre) => {
        const { data, error } = await client
          .from("material_ingredient_categories")
          .select("material_id")
          .eq("ingredient_category_id", genre.id);
        if (error !== null) throw error;
        return { genreId: genre.id, materialIds: new Set(data.map((row) => row.material_id)) };
      }),
    );

    const targets = published.data
      .map((material) => {
        const shared = members.filter((member) => member.materialIds.has(material.id));
        const candidates = published.data
          .filter(
            (other) =>
              other.id !== material.id && shared.some((member) => member.materialIds.has(other.id)),
          )
          .toSorted(
            (left, right) =>
              right.review_count - left.review_count || (left.id < right.id ? -1 : 1),
          );
        return { id: material.id, genreIds: shared.map((member) => member.genreId), candidates };
      })
      .toSorted((left, right) => right.candidates.length - left.candidates.length)
      .slice(0, 10);

    for (const target of targets) {
      const related = await listRelatedMaterialsWithSupabase(client, target.id, target.genreIds);
      if (!related.ok) throw new Error(`${target.id} の関連資材: ${related.error}`);
      expect(related.data.map((item) => item.id)).toEqual(
        target.candidates.slice(0, 3).map((candidate) => candidate.id),
      );
    }
  }, 30_000);

  it("投稿先候補には容器イラストを付け、未分類は null にする", async () => {
    const client = createLocalClient();
    const materials = await client
      .from("materials")
      .select(
        "id, name, manufacturer_name, review_count, avg_rating, manufacturer_verified_at, container_type_id",
      )
      .eq("publication_status", "published")
      .order("id")
      .limit(30);
    if (materials.error !== null) throw materials.error;
    const result = await withPostingMaterialImagesWithSupabase(client, materials.data);
    if (!result.ok) throw new Error(`投稿先候補の画像：${result.error}`);
    expect(result.data.map(({ id }) => id)).toEqual(materials.data.map(({ id }) => id));
    for (const item of result.data) {
      const material = materials.data.find((row) => row.id === item.id);
      if (!material) throw new Error("投稿先候補がありません。");
      expect(item.imageUrl).toBe(
        material.container_type_id
          ? `/images/container-shapes/${material.container_type_id}.png`
          : null,
      );
    }
  }, 20_000);
});
