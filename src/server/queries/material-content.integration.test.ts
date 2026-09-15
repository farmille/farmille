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
  it("ローカルDBから感想口コミ分布・実証詳細レポート・記事を取得できる", async () => {
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

    expect(distribution.ok).toBe(true);
    expect(reports.ok).toBe(true);
    expect(articles.ok).toBe(true);
    if (!distribution.ok || !reports.ok || !articles.ok)
      throw new Error("資材関連コンテンツを取得できません。");
    const { data: reviewRows, error: reviewsError } = await localClient
      .from("reviews")
      .select("rating")
      .eq("material_id", material.id)
      .eq("status", "published");
    expect(reviewsError).toBeNull();
    if (reviewRows === null) throw new Error("感想口コミを取得できません。");
    expect(distribution.data.total).toBe(reviewRows.length);
    for (const star of distribution.data.stars)
      expect(star.count).toBe(reviewRows.filter((review) => review.rating === star.rating).length);
    expect(reports.data.items.length).toBeLessThanOrEqual(3);
    expect(reports.data.total).toBeGreaterThanOrEqual(reports.data.items.length);
    expect(articles.data.total).toBeGreaterThanOrEqual(articles.data.items.length);
  });
});
