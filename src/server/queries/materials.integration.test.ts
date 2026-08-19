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
  });
});
