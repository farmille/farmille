import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import { generalRegistrationSchema } from "@/lib/auth/registration-schema";
import { authorizeGeneralUser, getSessionUser } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

import { readRegistrationProof } from "./registration-proof";

/**
 * ニックネームをほかの人が使っているか。保存するときと同じく前後の空白を除き、profiles の一意制約と同じ完全一致で比べる。
 * self（本人の user_id）が今使っているニックネームは、使われているとみなさない。
 */
export async function isHandleTakenByOthersWithSupabase(
  admin: SupabaseClient<Database>,
  handle: string,
  self: string | null,
): Promise<Result<boolean>> {
  const parsed = v.safeParse(generalRegistrationSchema.entries.handle, handle);
  if (!parsed.success) return fail("invalid_body");
  const { data, error } = await admin
    .from("profiles")
    .select("user_id")
    .eq("handle", parsed.output)
    .maybeSingle();
  if (error !== null) {
    console.error(`[auth] ニックネームの使用状況の確認に失敗: ${error.code} ${error.message}`);
    return fail("internal");
  }
  return succeed(data !== null && data.user_id !== self);
}

/** 登録の第2段階は未ログインなので、メール確認の本人証明があるときだけ答える。 */
export async function isRegistrationHandleTaken(handle: string): Promise<Result<boolean>> {
  if ((await readRegistrationProof()) === null) return fail("expired_link");
  return isHandleTakenByOthersWithSupabase(createAdminSupabase(), handle, null);
}

/** プロフィールの設定・編集では、ログイン中の本人の今のニックネームを除いて確かめる。 */
export async function isProfileHandleTaken(handle: string): Promise<Result<boolean>> {
  const session = authorizeGeneralUser(await getSessionUser());
  if (!session.ok) return session;
  return isHandleTakenByOthersWithSupabase(createAdminSupabase(), handle, session.data.userId);
}
