import type { EmailOtpType } from "@supabase/supabase-js";

import { clientEnv } from "@/env";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";

// パスワード再設定・メール確認のリンクから戻ってくる OTP 種別だけを受け付ける。
const EMAIL_OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && EMAIL_OTP_TYPES.some((type) => type === value);
}

/** 一般ログイン（02 §2 `/login`）。account_type は問わない（admin もここから入る）。 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<Result<{ userId: string }>> {
  if (email.length === 0 || password.length === 0) return fail("invalid_credentials");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error !== null) return fail(toErrorCode(error, "signIn"));

  return succeed({ userId: data.user.id });
}

export async function signOut(): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();

  if (error !== null) return fail(toErrorCode(error, "signOut"));

  return succeed(null);
}

/**
 * パスワード再設定メールの送信。
 * 未登録のメールに対しても Supabase 側が成功を返すため、画面には常に同じ結果を出す
 * （アカウントの有無を推測させない）。
 */
export async function requestPasswordReset(email: string): Promise<Result<null>> {
  if (email.length === 0) return fail("invalid_body");

  const supabase = await createServerSupabase();
  const redirectTo = new URL(
    "/auth/confirm?next=%2Fpassword-reset%2Fupdate",
    clientEnv.siteUrl,
  ).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error !== null) return fail(toErrorCode(error, "resetPasswordForEmail"));

  return succeed(null);
}

/** 再設定リンクで確立したセッションに対して新しいパスワードを設定する。 */
export async function updatePassword(password: string): Promise<Result<null>> {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return fail("weak_password");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password });

  if (error !== null) return fail(toErrorCode(error, "updatePassword"));

  return succeed(null);
}

/**
 * PKCE フローのメールリンク（`?code=`）をセッションへ交換する。
 * @supabase/ssr の既定は PKCE なので、Supabase 既定のメール文面はこちらで受ける。
 */
export async function exchangeAuthCode(code: string): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error !== null) {
    const code = toErrorCode(error, "exchangeCodeForSession");
    if (code !== "internal") return fail(code);

    return fail(error.status !== undefined && error.status < 500 ? "expired_link" : "internal");
  }

  return succeed(null);
}

/**
 * メール文面を token_hash 形式に差し替えた場合の受け口
 * （`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...`）。
 */
export async function verifyEmailOtp(type: EmailOtpType, tokenHash: string): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error !== null) {
    const code = toErrorCode(error, "verifyOtp");
    if (code !== "internal") return fail(code);

    // 使用済み・改竄されたリンクは 4xx で返る。リンク側の問題として扱う。
    return fail(error.status !== undefined && error.status < 500 ? "expired_link" : "internal");
  }

  return succeed(null);
}
