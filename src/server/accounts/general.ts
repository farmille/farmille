import { sendRegistrationEmail } from "./notification-email";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import { clientEnv } from "@/env";
import { generalRegistrationSchema } from "@/lib/auth/registration-schema";
import { ONBOARDING_PENDING } from "@/lib/onboarding";
import { validateFields, type FieldsValidation, type FormFieldValues } from "@/lib/validation";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createIsolatedAuthClient } from "@/server/supabase";
import type { Database } from "@/types/database.types";

import { readRegistrationProof, clearRegistrationProof } from "./registration-proof";

export type GeneralSignupInput = v.InferOutput<typeof generalRegistrationSchema>;
export type GeneralSignupValidation = FieldsValidation<typeof generalRegistrationSchema.entries>;
export type GeneralSignupResult = { userId: string; signedIn: boolean };

/** フォーム境界で必須項目・形式・同意をまとめて検証する。 */
export function validateGeneralSignup(
  raw: FormFieldValues<typeof generalRegistrationSchema.entries>,
): GeneralSignupValidation {
  return validateFields(generalRegistrationSchema, raw);
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

/** メールだけで本人確認を開始する。通常のセッションcookieは作らない。 */
export async function requestRegistrationEmail(
  email: string,
  next: string | null,
): Promise<Result<null>> {
  const redirectTo = new URL("/auth/confirm", clientEnv.siteUrl);
  redirectTo.searchParams.set("registration", "1");
  if (next) redirectTo.searchParams.set("next", next);
  const { error } = await createIsolatedAuthClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo.toString(), shouldCreateUser: true },
  });
  return error ? fail(toErrorCode(error, "registrationEmail")) : succeed(null);
}

const AccountMetadataSchema = v.object({ account_type: v.optional(v.string()) });

/** 確認済みで会員種別を持たない本人にだけ、第2段階を許可する。 */
export async function registrationIdentity(userId: string, admin: SupabaseClient<Database>) {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) return fail(toErrorCode(error, "registrationIdentity"));
  const user = data.user;
  if (!user?.email_confirmed_at || !user.email) return fail("expired_link");
  const metadata = v.safeParse(AccountMetadataSchema, user.app_metadata);
  if (!metadata.success || metadata.output.account_type !== undefined)
    return fail("email_unavailable");
  return succeed({ userId: user.id, email: user.email });
}

export async function getRegistrationIdentity() {
  const proof = await readRegistrationProof();
  if (!proof) return fail("expired_link");
  const result = await registrationIdentity(proof.userId, createAdminSupabase());
  if (result.ok && result.data.email !== proof.email) return fail("expired_link");
  return result;
}

/** 今回確保したプロフィールだけを取り消し、確認済みメールは保持する。 */
async function rollbackProfile(admin: SupabaseClient<Database>, userId: string) {
  const notification = await admin
    .from("registration_notifications")
    .delete()
    .eq("user_id", userId);
  if (notification.error)
    throw new Error("登録通知の取り消しに失敗しました。", { cause: notification.error });
  const profile = await admin.from("profiles").delete().eq("user_id", userId);
  if (profile.error)
    throw new Error("登録情報の取り消しに失敗しました。", { cause: profile.error });
}

export async function registerGeneralUser(
  input: GeneralSignupInput,
): Promise<Result<GeneralSignupResult>> {
  const identity = await getRegistrationIdentity();
  if (!identity.ok) return identity;
  const result = await registerGeneralUserWithSupabase(
    input,
    createAdminSupabase(),
    identity.data.userId,
  );
  if (result.ok) {
    await sendRegistrationEmail(identity.data.userId, identity.data.email);
    await clearRegistrationProof();
  }
  return result;
}

/** プロフィールの一意制約で同時送信を止め、すべて保存してから会員権限を与える。 */
export async function registerGeneralUserWithSupabase(
  input: GeneralSignupInput,
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<Result<GeneralSignupResult>> {
  const identity = await registrationIdentity(userId, admin);
  if (!identity.ok) return identity;
  if (input.email !== identity.data.email) return fail("expired_link");
  const handleTaken = await isHandleTaken(admin, input.handle);
  if (!handleTaken.ok) return handleTaken;
  if (handleTaken.data) return fail("handle_taken");

  const profile = await admin.from("profiles").insert({
    user_id: userId,
    handle: input.handle,
    standpoint: input.standpoint,
    prefecture_code: input.prefectureCode,
  });
  if (profile.error) {
    if (profile.error.code === "23505") return fail("handle_taken");
    console.error("[auth] 登録情報の保存に失敗", profile.error.code);
    return fail("internal");
  }
  const contact = await admin.from("profile_contact_details").insert({
    user_id: userId,
    family_name: input.familyName,
    given_name: input.givenName,
    phone: input.phone || null,
    postal_code: input.postalCode,
    city_street: input.cityStreet,
    building_name: input.buildingName || null,
  });
  if (contact.error) {
    await rollbackProfile(admin, userId);
    console.error("[auth] 非公開連絡先の保存に失敗", contact.error.code);
    return fail("internal");
  }
  const updated = await admin.auth.admin.updateUserById(userId, {
    password: input.password,
    app_metadata: { account_type: "general", onboarding: ONBOARDING_PENDING },
  });
  if (updated.error) {
    await rollbackProfile(admin, userId);
    return fail(toErrorCode(updated.error, "completeRegistration"));
  }
  return succeed({ userId, signedIn: false });
}
