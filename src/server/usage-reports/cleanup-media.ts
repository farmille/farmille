import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import type { Database } from "../../types/database.types.ts";

const ClaimedMediaSchema = v.array(v.object({ path: v.pipe(v.string(), v.minLength(1)) }));

/** DBで参照の追加を止めた画像だけを、Storage APIで実体ごと回収する。 */
export async function cleanupExpiredReportMedia(db: SupabaseClient<Database>): Promise<number> {
  const claimed = await db.rpc("claim_expired_report_media", { p_limit: 100 });

  if (claimed.error !== null)
    throw new Error("期限切れのレポート画像を確保できませんでした。", { cause: claimed.error });
  const paths = v.parse(ClaimedMediaSchema, claimed.data).map((row) => row.path);

  if (paths.length === 0) return 0;
  const removed = await db.storage.from("report-media").remove(paths);

  if (removed.error !== null || removed.data.length !== paths.length) {
    throw new Error("期限切れのレポート画像を削除できませんでした。", { cause: removed.error });
  }

  return removed.data.length;
}
