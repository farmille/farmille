import { createClient } from "@supabase/supabase-js";

import { clientEnv, serverEnv } from "../env.ts";
import type { Database } from "../types/database.types.ts";
import { cleanupExpiredReportMedia } from "./usage-reports/cleanup-media.ts";

const db = createClient<Database>(clientEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const removed = await cleanupExpiredReportMedia(db);
console.info(`期限切れのレポート画像を${removed}件削除しました。`);
