import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

/** view_events.target_type のうち詳細画面で記録する種別。 */
type ViewTargetType = "article" | "usage_report";

function reportViewError(operation: string, error: unknown): void {
  console.error(`[server/queries/view-events] ${operation}`, error);
}

/**
 * 記事・使用レポートの閲覧ログを追記する。
 * 表示用パスからは失敗を握りつぶしてよい（呼び出し側で Result を無視する）。
 */
export async function recordViewEvent({
  targetType,
  targetId,
  viewerUserId = null,
}: {
  targetType: ViewTargetType;
  targetId: string;
  viewerUserId?: string | null;
}): Promise<Result<null>> {
  if (targetId.length === 0) {
    throw new Error("targetId は空にできません。");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("view_events").insert({
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
