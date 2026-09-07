import type { SupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/env";
import {
  EMAIL_PATTERN,
  HANDLE_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/account-rules";
import { isStandpoint, type Standpoint } from "@/lib/standpoints";
import { formDataString, trimmedFormDataString } from "@/lib/validation";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

export type GeneralSignupInput = {
  handle: string;
  email: string;
  password: string;
  standpoint: Standpoint;
};

export type GeneralSignupFieldErrors = Partial<Record<keyof GeneralSignupInput, string>>;

export type GeneralSignupValidation =
  | { ok: true; input: GeneralSignupInput }
  | { ok: false; fieldErrors: GeneralSignupFieldErrors };

export type GeneralSignupResult = {
  userId: string;
  /** メール確認が不要な設定では、登録と同時にログイン状態になる。 */
  signedIn: boolean;
};

export function validateGeneralSignup(raw: {
  handle: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
  password: FormDataEntryValue | null;
  standpoint: FormDataEntryValue | null;
}): GeneralSignupValidation {
  const fieldErrors: GeneralSignupFieldErrors = {};

  const handle = trimmedFormDataString(raw.handle);
  if (handle.length === 0) {
    fieldErrors.handle = "ハンドルネームを入力してください。";
  } else if (handle.length > HANDLE_MAX_LENGTH) {
    fieldErrors.handle = `ハンドルネームは${HANDLE_MAX_LENGTH}文字以内で入力してください。`;
  }

  const email = trimmedFormDataString(raw.email);
  if (email.length === 0) {
    fieldErrors.email = "メールアドレスを入力してください。";
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "メールアドレスの形式が正しくありません。";
  }

  const password = formDataString(raw.password) ?? "";
  if (password.length < PASSWORD_MIN_LENGTH) {
    fieldErrors.password = `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください。`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    fieldErrors.password = `パスワードは${PASSWORD_MAX_LENGTH}文字以内で入力してください。`;
  }

  const standpoint = formDataString(raw.standpoint);
  if (!isStandpoint(standpoint)) {
    fieldErrors.standpoint = "あなたの立場を選択してください。";

    return { ok: false, fieldErrors };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      handle,
      email,
      password,
      standpoint,
    },
  };
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

/** 補償処理：profiles を作れなかった auth ユーザーを残さない。 */
async function rollbackAuthUser(admin: SupabaseClient<Database>, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error !== null) {
    console.error(`[auth] 補償削除に失敗しました user_id=${userId}: ${error.message}`);
  }
}

/**
 * 一般ユーザー登録（02 §2 `/signup`）。
 *
 * auth ユーザーと profiles 行の整合は server action 内の補償処理で担保する
 * （DB トリガー方式を採らない理由は docs/rebuild/tasks/T-13 の報告に記載）。
 *   1. handle の重複を先に弾く
 *   2. signUp（cookie にセッションが載る）
 *   3. app_metadata.account_type='general' を admin クライアントで付与
 *   4. profiles を作成
 *   5. 3 の付与を JWT に反映させるためセッションを更新
 * 3〜5 のいずれかで失敗した場合は auth ユーザーを削除して呼び出し元に失敗を返す。
 */
export async function registerGeneralUser(
  input: GeneralSignupInput,
): Promise<Result<GeneralSignupResult>> {
  const admin = createAdminSupabase();

  const handleTaken = await isHandleTaken(admin, input.handle);
  if (!handleTaken.ok) return handleTaken;
  if (handleTaken.data) return fail("handle_taken");

  const supabase = await createServerSupabase();
  const emailRedirectTo = new URL("/auth/confirm?next=%2F", clientEnv.siteUrl).toString();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo },
  });

  if (signUpError !== null) return fail(toErrorCode(signUpError, "signUp"));

  const user = signUpData.user;
  if (user === null) return fail("internal");

  // メール確認が有効な設定では、既存メールでも Supabase は成功を装った user を返す
  // （identities が空配列）。この場合は何も作らずに終える。
  if (user.identities !== undefined && user.identities.length === 0) {
    return fail("email_unavailable");
  }

  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { account_type: "general" },
  });

  if (metadataError !== null) {
    console.error(`[auth] account_type の付与に失敗: ${metadataError.message}`);
    await rollbackAuthUser(admin, user.id);

    return fail("internal");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    user_id: user.id,
    handle: input.handle,
    standpoint: input.standpoint,
  });

  if (profileError !== null) {
    await rollbackAuthUser(admin, user.id);

    // handle の unique 制約。重複確認との競合で後勝ちした場合にここへ来る。
    if (profileError.code === "23505") return fail("handle_taken");

    console.error(`[auth] profiles の作成に失敗: ${profileError.code} ${profileError.message}`);

    return fail("internal");
  }

  if (signUpData.session === null) {
    // メール確認が必要な設定。確認リンクを開いた時点で account_type 付きの JWT が発行される。
    return succeed({ userId: user.id, signedIn: false });
  }

  const { error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError !== null) {
    // 更新できなかった JWT には account_type が入らず RLS を通せない。
    // 中途半端なセッションを残さず、ログインし直してもらう。
    console.error(`[auth] セッション更新に失敗: ${refreshError.message}`);
    await supabase.auth.signOut();

    return succeed({ userId: user.id, signedIn: false });
  }

  return succeed({ userId: user.id, signedIn: true });
}
