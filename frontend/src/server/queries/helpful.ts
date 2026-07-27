import type { HelpfulTargetType } from "@/server/mutations/helpful";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

const IN_FILTER_CHUNK_SIZE = 100;

function reportQueryError(operation: string, error: unknown): void {
  console.error(`[server/queries/helpful] ${operation}`, error);
}

/**
 * 閲覧者（ログイン中の一般ユーザー）が「参考になった」を押した対象 ID の集合を返す。
 * 未ログイン（userId === null）や対象なしの場合は空集合。
 */
export async function getViewerHelpfulVotes(
  userId: string | null,
  targetType: HelpfulTargetType,
  targetIds: readonly string[],
): Promise<Result<ReadonlySet<string>>> {
  if (userId === null || targetIds.length === 0) {
    return succeed(new Set());
  }

  const supabase = await createServerSupabase();
  const votedIds = new Set<string>();

  for (let start = 0; start < targetIds.length; start += IN_FILTER_CHUNK_SIZE) {
    const chunk = targetIds.slice(start, start + IN_FILTER_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("helpful_votes")
      .select("target_id")
      .eq("user_id", userId)
      .eq("target_type", targetType)
      .in("target_id", chunk);

    if (error !== null) {
      reportQueryError("参考になった投票状況の取得に失敗", { targetType, error });
      return fail("internal");
    }

    for (const row of data) {
      votedIds.add(row.target_id);
    }
  }

  return succeed(votedIds);
}

/** 単一対象について、閲覧者が「参考になった」を押しているかどうか。 */
export async function isHelpfulVotedByViewer(
  userId: string | null,
  targetType: HelpfulTargetType,
  targetId: string,
): Promise<Result<boolean>> {
  const votes = await getViewerHelpfulVotes(userId, targetType, [targetId]);
  if (!votes.ok) return votes;

  return succeed(votes.data.has(targetId));
}
