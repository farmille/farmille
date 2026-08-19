import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  getReviewRatingDistributionWithSupabase,
  listPublishedArticlesByMaterialWithSupabase,
  listPublishedUsageReportsByMaterialWithSupabase,
} from "@/server/queries/material-content";
import type { Database } from "@/types/database.types";

const localSupabaseUrl = process.env.SUPABASE_LOCAL_URL;

describe.skipIf(localSupabaseUrl === undefined)("資材関連コンテンツ統合", () => {
  it("ローカルDBからレビュー分布・使用レポート・記事を取得できる", async () => {
    const localPublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (localSupabaseUrl === undefined) {
      throw new Error("SUPABASE_LOCAL_URL が設定されていません。");
    }

    if (localPublishableKey === undefined || localPublishableKey.length === 0) {
      throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません。");
    }

    const localClient = createClient<Database>(localSupabaseUrl, localPublishableKey);
    const { data: material, error } = await localClient
      .from("materials")
      .select("id")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    expect(error).toBeNull();

    if (material === null) {
      throw new Error("検証対象の資材がありません。");
    }

    const [distribution, reports, articles] = await Promise.all([
      getReviewRatingDistributionWithSupabase(localClient, material.id),
      listPublishedUsageReportsByMaterialWithSupabase(localClient, material.id, { limit: 3 }),
      listPublishedArticlesByMaterialWithSupabase(localClient, material.id),
    ]);

    expect(distribution).toEqual({
      ok: true,
      data: {
        total: 0,
        stars: [
          { rating: 5, count: 0 },
          { rating: 4, count: 0 },
          { rating: 3, count: 0 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 },
        ],
      },
    });
    expect(reports).toEqual({ ok: true, data: { items: [], total: 0 } });
    expect(articles).toEqual({ ok: true, data: { items: [], total: 0 } });
  });
});
