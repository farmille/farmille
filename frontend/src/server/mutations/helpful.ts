import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

/**
 * helpful_votes.target_type のうち UI から押下できる種別。
 * 01 §3 の CHECK は 'answer' も許可するが、Q&A は Phase 2 まで非表示のため対象外。
 */
export const HELPFUL_TARGET_TYPES = ["review", "usage_report", "article"] as const;
export type HelpfulTargetType = (typeof HELPFUL_TARGET_TYPES)[number];

export function isHelpfulTargetType(value: string): value is HelpfulTargetType {
  return (HELPFUL_TARGET_TYPES as readonly string[]).includes(value);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** PostgreSQL の unique_violation。同時押下などの競合検知に使う。 */
const UNIQUE_VIOLATION = "23505";

function reportMutationError(operation: string, error: unknown): void {
  console.error(`[server/mutations/helpful] ${operation}`, error);
}

/**
 * 対象が published で存在すること・自分の投稿でないことを確認する。
 * 記事の投稿者は出品者（profiles を持たない）のため自演確認は行わない。
 */
async function assertHelpfulTarget(
  supabase: SupabaseClient<Database>,
  targetType: HelpfulTargetType,
  targetId: string,
  userId: string,
): Promise<Result<null>> {
  if (targetType === "review") {
    const { data, error } = await supabase
      .from("reviews")
      .select("author_user_id, status")
      .eq("id", targetId)
      .maybeSingle();

    if (error !== null) {
      reportMutationError("対象レビューの確認に失敗", error);
      return fail("internal");
    }
    if (data === null || data.status !== "published") return fail("not_found");
    if (data.author_user_id === userId) return fail("forbidden");
    return succeed(null);
  }

  if (targetType === "usage_report") {
    const { data, error } = await supabase
      .from("usage_reports")
      .select("author_user_id, status")
      .eq("id", targetId)
      .maybeSingle();

    if (error !== null) {
      reportMutationError("対象使用レポートの確認に失敗", error);
      return fail("internal");
    }
    if (data === null || data.status !== "published") return fail("not_found");
    if (data.author_user_id === userId) return fail("forbidden");
    return succeed(null);
  }

  const { data, error } = await supabase
    .from("articles")
    .select("status")
    .eq("id", targetId)
    .maybeSingle();

  if (error !== null) {
    reportMutationError("対象記事の確認に失敗", error);
    return fail("internal");
  }
  if (data === null || data.status !== "published") return fail("not_found");
  return succeed(null);
}

/**
 * 「参考になった」をトグルする。個票（helpful_votes）を追加／削除し、
 * 表示用件数は helpful_counts ビュー経由で別途取得する（01 §3・§7）。
 */
export async function toggleHelpfulVote(
  targetType: HelpfulTargetType,
  targetId: string,
  userId: string,
): Promise<Result<{ voted: boolean }>> {
  if (!UUID_PATTERN.test(targetId)) return fail("not_found");

  const supabase = await createServerSupabase();
  const target = await assertHelpfulTarget(supabase, targetType, targetId, userId);
  if (!target.ok) return target;

  const { data: existing, error: existingError } = await supabase
    .from("helpful_votes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existingError !== null) {
    reportMutationError("参考になった状態の確認に失敗", existingError);
    return fail("internal");
  }

  if (existing !== null) {
    const { error } = await supabase
      .from("helpful_votes")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error !== null) {
      reportMutationError("参考になったの取り消しに失敗", error);
      return fail("internal");
    }

    return succeed({ voted: false });
  }

  const { error } = await supabase.from("helpful_votes").insert({
    user_id: userId,
    target_type: targetType,
    target_id: targetId,
  });

  if (error !== null) {
    if (error.code === UNIQUE_VIOLATION) {
      // 二重送信などの競合。既に登録済みとして扱う。
      return succeed({ voted: true });
    }
    reportMutationError("参考になったの登録に失敗", error);
    return fail("internal");
  }

  return succeed({ voted: true });
}
