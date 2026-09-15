import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

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
        const detail = await getMaterialWithSupabase(localClient, firstMaterial.id);

        expect(detail.ok).toBe(true);
      }
    }
  }, 20_000);
});
