import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { recordViewEvents, viewEventsInsertFor } from "@/server/queries/view-events";
import type { Database } from "@/types/database.types";

const localSupabaseUrl = process.env.SUPABASE_LOCAL_URL;

describe.skipIf(localSupabaseUrl === undefined)("感想口コミの閲覧数の記録（統合）", () => {
  it("anon で review の閲覧ログを一括追記でき、view_counts_total が増える", async () => {
    const localPublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (localSupabaseUrl === undefined) {
      throw new Error("SUPABASE_LOCAL_URL が設定されていません。");
    }

    if (localPublishableKey === undefined || localPublishableKey.length === 0) {
      throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません。");
    }

    const client = createClient<Database>(localSupabaseUrl, localPublishableKey);
    const { data: reviews, error } = await client
      .from("reviews")
      .select("id")
      .order("id", { ascending: true })
      .limit(2);

    expect(error).toBeNull();

    if (reviews === null || reviews.length === 0) {
      throw new Error("検証対象の感想口コミがありません。");
    }

    const ids = reviews.map((review) => review.id);
    const countsOf = async () => {
      const { data, error: countError } = await client
        .from("view_counts_total")
        .select("target_id, view_count")
        .eq("target_type", "review")
        .in("target_id", ids);
      expect(countError).toBeNull();
      return new Map((data ?? []).map((row) => [row.target_id, row.view_count ?? 0]));
    };

    const before = await countsOf();
    const result = await recordViewEvents({
      targetType: "review",
      targetIds: ids,
      insert: viewEventsInsertFor(client),
    });
    const after = await countsOf();

    expect(result).toEqual({ ok: true, data: null });
    for (const id of ids) {
      expect(after.get(id)).toBe((before.get(id) ?? 0) + 1);
    }
  });
});
