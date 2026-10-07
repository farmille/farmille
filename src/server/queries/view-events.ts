import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ViewTargetType = "article" | "usage_report" | "material" | "review";

type ViewEventInsert = Database["public"]["Tables"]["view_events"]["Insert"];

export type ViewEventsInsert<InsertError> = (
  rows: ViewEventInsert[],
) => Promise<{ error: InsertError | null }>;

function reportViewError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/view-events] ${operation}`, error);
}

/**
 * 資材詳細・記事・実証詳細レポートの閲覧ログを追記する。
 * 表示用パスからは失敗を握りつぶしてよい（呼び出し側で Result を無視する）。
 *
 * 呼び出し側は `next/server` の `after()` からこの関数を呼ぶ想定だが、
 * `after()` の中では `cookies()`（＝ `createServerSupabase()` 内部の呼び出し）が
 * 使えない（Next.js の制約）。そのため `supabase` は `after()` の外で
 * 生成したクライアントを渡す（省略時のみ内部で生成する）。
 */
export async function recordViewEvent({
  targetType,
  targetId,
  viewerUserId = null,
  supabase,
}: {
  targetType: ViewTargetType;
  targetId: string;
  viewerUserId?: string | null;
  supabase?: SupabaseClient<Database>;
}): Promise<Result<null>> {
  if (targetId.length === 0) {
    throw new Error("targetId は空にできません。");
  }

  const client = supabase ?? (await createServerSupabase());
  const { error } = await client.from("view_events").insert({
    target_type: targetType,
    target_id: targetId,
    viewer_user_id: viewerUserId,
  });

  if (error !== null) {
    reportViewError("閲覧イベントの記録に失敗", error);
    return fail("internal");
  }

  return succeed(null);
}

/**
 * `after()` の中では `cookies()` が使えないため、クライアントは `after()` の外で
 * 生成して渡す。
 */
export function viewEventsInsertFor(
  supabase: SupabaseClient<Database>,
): ViewEventsInsert<{ message: string }> {
  return async (rows) => {
    const { error } = await supabase.from("view_events").insert(rows);
    return { error };
  };
}

export async function recordViewEvents<InsertError>({
  targetType,
  targetIds,
  viewerUserId = null,
  insert,
}: {
  targetType: ViewTargetType;
  targetIds: readonly string[];
  viewerUserId?: string | null;
  insert: ViewEventsInsert<InsertError>;
}): Promise<Result<null>> {
  if (targetIds.some((targetId) => targetId.length === 0)) {
    throw new Error("targetIds に空の値は含められません。");
  }

  if (targetIds.length === 0) {
    return succeed(null);
  }

  const { error } = await insert(
    targetIds.map((targetId) => ({
      target_type: targetType,
      target_id: targetId,
      viewer_user_id: viewerUserId,
    })),
  );

  if (error !== null) {
    reportViewError("閲覧イベントの一括記録に失敗", error);
    return fail("internal");
  }

  return succeed(null);
}
