import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { listClassificationOptionsWithSupabase } from "@/server/queries/classifications";
import { getMaterialWithSupabase, listMaterialsWithSupabase } from "@/server/queries/materials";
import type { Database } from "@/types/database.types";

const localSupabaseUrl = process.env.SUPABASE_LOCAL_URL;

describe.skipIf(localSupabaseUrl === undefined)("listMaterials 統合", () => {
  it("ローカルDBから公開資材一覧を取得できる", async () => {
    const localPublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (localSupabaseUrl === undefined) {
      throw new Error("SUPABASE_LOCAL_URL が設定されていません。");
    }

    if (localPublishableKey === undefined || localPublishableKey.length === 0) {
      throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません。");
    }

    const localClient = createClient<Database>(localSupabaseUrl, localPublishableKey);
    const { data: genres, error: genreError } = await localClient
      .from("ingredient_categories")
      .select("id");
    expect(genreError).toBeNull();
    expect(genres).toHaveLength(8);
    if (genres === null) throw new Error("資材ジャンルが取得できません。");
    await Promise.all(
      genres.map(async (genre) => {
        const result = await listMaterialsWithSupabase(localClient, {
          page: 1,
          filters: [{ category: "genre", id: genre.id }],
        });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error);
        const keywordResult = await listMaterialsWithSupabase(localClient, {
          page: 1,
          keywordMatches: {
            filters: [{ category: "genre", id: genre.id, name: "", aliases: [], sort_order: 0 }],
            makerNames: [],
            materialNames: [],
          },
        });
        expect(keywordResult.ok).toBe(true);
        if (!keywordResult.ok) throw new Error(keywordResult.error);
        expect(keywordResult.data.total).toBe(result.data.total);
        const { data: relations, error } = await localClient
          .from("material_ingredient_categories")
          .select("material_id")
          .eq("ingredient_category_id", genre.id);
        expect(error).toBeNull();
        const ids = new Set(relations?.map((row) => row.material_id));
        for (const item of result.data.items) expect(ids.has(item.id)).toBe(true);
      }),
    );
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

        const keyword = await listMaterialsWithSupabase(localClient, {
          page: 1,
          keywordMatches: { filters: [], makerNames: [], materialNames: [firstMaterial.name] },
        });
        expect(keyword.ok).toBe(true);
        if (!keyword.ok) throw new Error(keyword.error);
        expect(keyword.data.items.some((item) => item.id === firstMaterial.id)).toBe(true);
        expect(keyword.data.items.every((item) => item.name === firstMaterial.name)).toBe(true);

        // 資材名とメーカー名は OR。同じ資材に両方一致しても件数を重複させない。
        const union = await listMaterialsWithSupabase(localClient, {
          page: 1,
          keywordMatches: {
            filters: [],
            makerNames: [firstMaterial.manufacturer_name],
            materialNames: [firstMaterial.name],
          },
        });
        expect(union.ok).toBe(true);
        if (!union.ok) throw new Error(union.error);
        expect(union.data.total).toBeGreaterThanOrEqual(keyword.data.total);
        expect(new Set(union.data.items.map((item) => item.id)).size).toBe(union.data.items.length);

        const noMatch = await listMaterialsWithSupabase(localClient, {
          page: 1,
          keywordMatches: { filters: [], makerNames: [], materialNames: [] },
        });
        expect(noMatch.ok).toBe(true);
        if (!noMatch.ok) throw new Error(noMatch.error);
        expect(noMatch.data.total).toBe(0);
      }
    }
  }, 20_000);
});
