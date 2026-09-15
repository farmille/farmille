import { cache } from "react";
import * as v from "valibot";

import { getSessionUser } from "@/server/auth";
import { createServerSupabase } from "@/server/supabase";

export const PostTargetSchema = v.picklist(["review", "usage_report"]);
export type PostTarget = v.InferOutput<typeof PostTargetSchema>;
export const PostIdSchema = v.pipe(v.string(), v.uuid());

/** カードが共通で使う、本人の保存状態と公開集計。 */
export const getPostActions = cache(async (target: PostTarget, id: string) => {
  const supabase = await createServerSupabase();
  const session = await getSessionUser();
  const column = target === "review" ? "review_id" : "usage_report_id";
  const [views, saved, helpful, post] = await Promise.all([
    supabase
      .from("view_counts_daily")
      .select("view_count")
      .eq("target_type", target)
      .eq("target_id", id),
    session === null
      ? null
      : supabase
          .from("saved_posts")
          .select("id")
          .eq("user_id", session.userId)
          .eq(column, id)
          .maybeSingle(),
    session === null
      ? null
      : supabase
          .from("helpful_votes")
          .select("id")
          .eq("user_id", session.userId)
          .eq("target_type", target)
          .eq("target_id", id)
          .maybeSingle(),
    supabase
      .from(target === "review" ? "reviews" : "usage_reports")
      .select("author_user_id")
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (views.error || saved?.error || helpful?.error || post.error)
    throw new Error("投稿の保存状態・閲覧数を取得できませんでした。");
  const viewCount = views.data.reduce((sum, row) => {
    if (row.view_count === null) throw new Error("投稿の閲覧数が欠落しています。");
    return sum + row.view_count;
  }, 0);
  return {
    saved: saved?.data != null,
    voted: helpful?.data != null,
    viewCount,
    own: session !== null && post.data?.author_user_id === session.userId,
  };
});

/** 保存一覧は投稿側の公開権限も通して取得する。非公開化された投稿は表示しない。 */
export async function listSavedPosts(userId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("saved_posts")
    .select(`
    id, review_id, usage_report_id,
    review:reviews(id, body, material_id, status),
    report:usage_reports(id, title, status)
  `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("保存した投稿を取得できませんでした。");
  return data;
}
