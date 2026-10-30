import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/types/database.types";
import { listOwnPostsWithSupabase, type OwnPostItem } from "./me-page";

type ReportStatus = Extract<OwnPostItem, { kind: "usage_report" }>["status"];

function report(id: string, status: ReportStatus) {
  return {
    id,
    material_id: "material",
    title: id,
    status,
    created_at: "2026-10-20T00:00:00Z",
    published_at: status === "published" ? "2026-10-20T00:00:00Z" : null,
    crop: { id: "tomato", name: "トマト" },
    material: { id: "material", name: "テスト資材" },
  };
}

function clientWithPosts(reports: ReturnType<typeof report>[]) {
  const client = createClient<Database>("https://example.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: crypto.randomUUID() },
    global: {
      fetch: async (input, init) => {
        const url = new URL(new Request(input, init).url);

        switch (url.pathname) {
          case "/rest/v1/reviews":
            return Response.json([
              {
                id: "review",
                material_id: "material",
                rating: 4,
                body: "使いやすい",
                created_at: "2026-10-20T00:00:00Z",
                cropRelations: { sort_order: 0, crop: { id: "tomato", name: "トマト" } },
                material: { id: "material", name: "テスト資材" },
              },
            ]);
          case "/rest/v1/usage_reports":
            return Response.json(reports);
          case "/rest/v1/helpful_counts":
            return Response.json(
              url.searchParams.get("target_type") === "eq.review"
                ? [{ target_id: "review", helpful_count: 3 }]
                : reports.map(({ id }) => ({ target_id: id, helpful_count: 2 })),
            );
          default:
            throw new Error(`想定外のリクエスト：${url.pathname}`);
        }
      },
    },
  });

  return client;
}

describe("マイページの参考になった合計", () => {
  it.each<ReportStatus>(["pending"])("%sのレポートの票を除き、投稿一覧には残す", async (status) => {
    const client = clientWithPosts([
      report("published", "published"),
      report("unpublished", status),
    ]);

    const result = await listOwnPostsWithSupabase(client, "author");

    expect(result.ok).toBe(true);

    if (!result.ok) throw new Error(result.error);
    expect(result.data.helpfulReceivedCount).toBe(5);
    expect(result.data.posts).toContainEqual(
      expect.objectContaining({ id: "unpublished", status, helpfulCount: 2 }),
    );
  });

  it("投稿一覧の表示上限より多くても、すべての公開済み投稿の票を数える", async () => {
    const client = clientWithPosts(
      Array.from({ length: 10 }, (_, index) => report(`report-${index}`, "published")),
    );

    const result = await listOwnPostsWithSupabase(client, "author");

    expect(result.ok).toBe(true);

    if (!result.ok) throw new Error(result.error);
    expect(result.data.posts).toHaveLength(8);
    expect(result.data.helpfulReceivedCount).toBe(23);
    // 投稿の一覧は新しい8件に絞っても、件数は絞る前のすべてを数える
    expect(result.data.reportCount).toBe(10);
    expect(result.data.reviewCount).toBe(1);
  });
});
