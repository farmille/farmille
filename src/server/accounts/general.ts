import { sendPendingRegistrationEmail } from "./notification-email";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import { clientEnv } from "@/env";
import { generalRegistrationSchema } from "@/lib/auth/registration-schema";
import { safeNextPath } from "@/lib/auth/safe-next";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

export type GeneralSignupInput = v.InferOutput<typeof generalRegistrationSchema>;
export type GeneralSignupFieldErrors = Partial<Record<keyof GeneralSignupInput, string>>;
export type GeneralSignupValidation =
  | { ok: true; input: GeneralSignupInput }
  | { ok: false; fieldErrors: GeneralSignupFieldErrors };
export type GeneralSignupResult = { userId: string; signedIn: boolean };

/** フォーム境界で必須項目・形式・同意をまとめて検証する。 */
type GeneralSignupFormValues = { [Key in keyof GeneralSignupInput]: FormDataEntryValue | null };
export function validateGeneralSignup(raw: GeneralSignupFormValues): GeneralSignupValidation {
  const result = v.safeParse(generalRegistrationSchema, raw);
  if (result.success) return { ok: true, input: result.output };
  const fieldErrors: GeneralSignupFieldErrors = {};
  const nested = v.flatten(result.issues).nested;
  for (const key of Object.keys(generalRegistrationSchema.entries)) {
    const parsedKey = v.parse(v.keyof(generalRegistrationSchema), key);
    const message = nested?.[parsedKey]?.[0];
    if (message !== undefined) fieldErrors[parsedKey] = message;
  }
  return { ok: false, fieldErrors };
}

async function isHandleTaken(
  admin: SupabaseClient<Database>,
  handle: string,
): Promise<Result<boolean>> {
  const { data, error } = await admin
    .from("profiles")
    .select("user_id")
    .eq("handle", handle)
    .maybeSingle();

  if (error !== null) {
    console.error(`[auth] handle の重複確認に失敗: ${error.code} ${error.message}`);

    return fail("internal");
  }

  return succeed(data !== null);
}

/** この登録処理で作成した Auth ユーザーだけを補償削除する。 */
async function rollbackAuthUser(admin: SupabaseClient<Database>, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error !== null) {
    console.error(`[auth] 補償削除に失敗しました user_id=${userId}: ${error.message}`);
  }
}

/** 一般登録後、メール確認済みの本人へ登録完了メールを送る。 */
export async function registerGeneralUser(
  input: GeneralSignupInput,
  next: string | null = null,
): Promise<Result<GeneralSignupResult>> {
  const admin = createAdminSupabase();
  const supabase = await createServerSupabase();
  const emailRedirectTo = new URL(
    `/auth/confirm?next=${encodeURIComponent(safeNextPath(next) ?? "/")}`,
    clientEnv.siteUrl,
  ).toString();
  const result = await registerGeneralUserWithSupabase(input, admin, supabase, emailRedirectTo);
  if (result.ok && result.data.signedIn) await sendPendingRegistrationEmail();
  return result;
}

/** 新規作成が確定したIDにだけ登録情報を保存し、保存後にメール確認へ進む。 */
export async function registerGeneralUserWithSupabase(
  input: GeneralSignupInput,
  admin: SupabaseClient<Database>,
  supabase: SupabaseClient<Database>,
  emailRedirectTo: string,
): Promise<Result<GeneralSignupResult>> {
  const handleTaken = await isHandleTaken(admin, input.handle);
  if (!handleTaken.ok) return handleTaken;
  if (handleTaken.data) return fail("handle_taken");

  // createUser は未確認メールの重複も拒否する。返されたIDだけを補償削除の対象にする。
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
    app_metadata: { account_type: "general" },
  });
  if (createError !== null) return fail(toErrorCode(createError, "createUser"));
  const user = created.user;
  if (user === null) return fail("internal");

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: user.id,
    handle: input.handle,
    standpoint: input.standpoint,
    prefecture_code: input.prefectureCode,
  });

  if (profileError !== null) {
    await rollbackAuthUser(admin, user.id);

    // handle の unique 制約。重複確認との競合で後勝ちした場合にここへ来る。
    if (profileError.code === "23505") return fail("handle_taken");

    console.error(`[auth] profiles の作成に失敗: ${profileError.code} ${profileError.message}`);

    return fail("internal");
  }

  const { error: contactError } = await admin.from("profile_contact_details").insert({
    user_id: user.id,
    family_name: input.familyName,
    given_name: input.givenName,
    phone: input.phone || null,
    postal_code: input.postalCode,
    city: input.city,
    street_address: input.streetAddress,
    building_name: input.buildingName || null,
  });
  if (contactError !== null) {
    console.error("[auth] 非公開連絡先の保存に失敗", contactError.code);
    await rollbackAuthUser(admin, user.id);
    return fail("internal");
  }

  // 確認メールの送信とセッションの発行は、Supabaseのメール確認設定に従う。
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo },
  });
  if (signUpError !== null) {
    await rollbackAuthUser(admin, user.id);
    return fail(toErrorCode(signUpError, "signUp"));
  }

  if (signUpData.user?.id !== user.id) {
    console.error("[auth] 登録したユーザーと認証結果のIDが一致しません。");
    if (signUpData.session !== null) {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error !== null) console.error("[auth] 登録セッションの破棄に失敗", error.code);
    }
    await rollbackAuthUser(admin, user.id);
    return fail("internal");
  }

  return succeed({ userId: user.id, signedIn: signUpData.session !== null });
}
