"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { getSessionUser, requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { PostIdSchema, PostTargetSchema, type PostTarget } from "@/server/queries/post-actions";
import { createServerSupabase } from "@/server/supabase";

/** 保存する状態を明示して送ることで、二重送信でも同じ結果にする。 */
export async function setPostSavedAction(
  target: PostTarget,
  id: string,
  path: string,
  saved: boolean,
): Promise<boolean> {
  v.parse(PostTargetSchema, target);
  v.parse(PostIdSchema, id);
  v.parse(v.boolean(), saved);
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") redirect(`/login?next=${encodeURIComponent(path)}`);
    throw new Error(errorMessageJa[session.error]);
  }

  const supabase = await createServerSupabase();
  const column = target === "review" ? "review_id" : "usage_report_id";

  const result = saved
    ? await supabase.from("saved_posts").insert({
        user_id: session.data.userId,
        review_id: target === "review" ? id : null,
        usage_report_id: target === "usage_report" ? id : null,
      })
    : await supabase.from("saved_posts").delete().eq("user_id", session.data.userId).eq(column, id);

  if (result.error && !(saved && result.error.code === "23505"))
    throw new Error("投稿の保存状態を変更できませんでした。もう一度お試しください。");
  revalidatePath("/me/saved");

  return saved;
}

/** 感想口コミのカードが画面内に入ったときに記録する。 */
export async function recordReviewCardView(id: string): Promise<void> {
  v.parse(PostIdSchema, id);
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || data === null) throw new Error("閲覧対象の感想口コミを確認できませんでした。");
  const session = await getSessionUser();

  const result = await supabase
    .from("view_events")
    .insert({ target_type: "review", target_id: id, viewer_user_id: session?.userId ?? null });

  if (result.error) throw new Error("閲覧数を記録できませんでした。");
}
