import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { listClassificationOptionsWithSupabase } from "@/server/queries/classifications";
import {
  getMaterialWithSupabase,
  listMaterialsWithSupabase,
  listRelatedMaterialsWithSupabase,
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
});
