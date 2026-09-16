import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

export type HomeFeedSort = "newest" | "helpful";
type HomeCandidate = Pick<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">;

/** 全公開投稿を候補にする。直近の数件だけでランキングを作らない。 */
export async function homeFeedIds(
  target: "review" | "usage_report",
  sort: HomeFeedSort,
  limit: number,
) {
  const client = await createServerSupabase();
  const dateColumn = target === "review" ? "created_at" : "published_at";
  const candidates: Pick<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">[] =
    [];
  for (let offset = 0; ; offset += 500) {
    const query =
      target === "review"
        ? client
            .from("reviews")
            .select("id, sort_date:created_at, material:materials!inner(publication_status)")
            .eq("material.publication_status", "published")
        : client.rpc("list_usage_report_previews").select("id, sort_date:published_at");
    const result = await query
      .eq("status", "published")
      .order(dateColumn, { ascending: false })
      .order("id")
      .range(offset, offset + (sort === "newest" ? limit : 500) - 1);
    if (result.error)
      throw new Error("ホームの公開投稿候補を取得できませんでした。", { cause: result.error });
    for (const row of result.data) {
      if (row.sort_date === null) throw new Error("公開投稿の日時が欠落しています。");
      candidates.push({ id: row.id, created_at: row.sort_date });
    }
    if (sort === "newest" || result.data.length < 500) break;
  }
  if (sort === "newest") return candidates.slice(0, limit).map((item) => item.id);

  // 個票は画面へ返さない。公開投稿の件数だけをサーバー内で集計する。
  const admin = createAdminSupabase();
  const counts = new Map<string, number>();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  for (let start = 0; start < candidates.length; start += 100) {
    const ids = candidates.slice(start, start + 100).map((item) => item.id);
    for (let offset = 0; ; offset += 500) {
      let query = admin
        .from("helpful_votes")
        .select("id, target_id")
        .eq("target_type", target)
        .in("target_id", ids)
        .order("id");
      if (target === "review") query = query.gte("created_at", since);
      const result = await query.range(offset, offset + 499);
      if (result.error)
        throw new Error("参考になったの集計に失敗しました。", { cause: result.error });
      for (const row of result.data)
        counts.set(row.target_id, (counts.get(row.target_id) ?? 0) + 1);
      if (result.data.length < 500) break;
    }
  }
  return rankHomeCandidates(candidates, counts, limit);
}

/** 同点は公開日時・IDで固定し、一覧の順序を安定させる。 */
export function rankHomeCandidates(
  candidates: readonly HomeCandidate[],
  counts: ReadonlyMap<string, number>,
  limit: number,
) {
  return candidates
    .toSorted(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
        b.created_at.localeCompare(a.created_at) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit)
    .map((item) => item.id);
}
