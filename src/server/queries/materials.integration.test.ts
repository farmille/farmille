import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { matchSearchCatalog, type SearchCatalog } from "@/lib/material-search";

import { listClassificationOptionsWithSupabase } from "@/server/queries/classifications";
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

describe.skipIf(localSupabaseUrl === undefined)("分類マスタ 統合", () => {
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
});
