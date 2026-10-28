import * as v from "valibot";

import { HANDLE_MAX_LENGTH } from "@/lib/auth/account-rules";
import { STANDPOINTS } from "@/lib/standpoints";
import { authorizeGeneralUser, getSessionUser } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

export const PersonalProfileSchema = v.object({
  handle: v.pipe(
    v.string("ハンドルネームを入力してください。"),
    v.trim(),
    v.minLength(1, "ハンドルネームを入力してください。"),
    v.maxLength(
      HANDLE_MAX_LENGTH,
      `ハンドルネームは${HANDLE_MAX_LENGTH}文字以内で入力してください。`,
    ),
  ),
  standpoint: v.picklist(
    STANDPOINTS.map(({ value }) => value),
    "あなたの属性を選択してください。",
  ),
});

/** 本人の初回プロフィールだけを作成する。既存の行は変更しない。 */
export async function createPersonalProfile(
  input: v.InferOutput<typeof PersonalProfileSchema>,
): Promise<Result<null>> {
  const session = authorizeGeneralUser(await getSessionUser());
  if (!session.ok) return session;
  const supabase = await createServerSupabase();
  const existing = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", session.data.userId)
    .maybeSingle();
  if (existing.error !== null) {
    console.error("プロフィールの確認に失敗しました", existing.error);
    return fail("internal");
  }
  if (existing.data !== null) return succeed(null);

  const { error } = await supabase.from("profiles").insert({
    user_id: session.data.userId,
    handle: input.handle,
    standpoint: input.standpoint,
  });
  if (error !== null) {
    if (error.code === "23505") return fail("handle_taken");
    console.error("プロフィールの作成に失敗しました", error);
    return fail("internal");
  }
  return succeed(null);
}
