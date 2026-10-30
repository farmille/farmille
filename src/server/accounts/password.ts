import * as v from "valibot";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/account-rules";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { getSessionUser } from "@/server/auth";
import { fail, succeed, type Result } from "@/server/result";
import { createIsolatedAuthClient, createServerSupabase } from "@/server/supabase";

const NewPasswordSchema = v.pipe(
  v.string(),
  v.minLength(PASSWORD_MIN_LENGTH),
  v.maxLength(PASSWORD_MAX_LENGTH),
);

export const PasswordChangeSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.minLength(1), v.maxLength(PASSWORD_MAX_LENGTH)),
    password: NewPasswordSchema,
    passwordConfirmation: v.string(),
  }),
  v.check(
    (input) => input.password === input.passwordConfirmation,
    "確認用のパスワードが一致しません。",
  ),
  v.check(
    (input) => input.password !== input.currentPassword,
    "現在と異なるパスワードを設定してください。",
  ),
);

export type PasswordChangeInput = v.InferOutput<typeof PasswordChangeSchema>;

/** ログイン中の本人に現在のパスワードを求め、既存のMFAを保持して変更する。 */
export async function changePassword(input: PasswordChangeInput): Promise<Result<null>> {
  const parsed = v.safeParse(PasswordChangeSchema, input);

  if (!parsed.success) return fail("invalid_body");
  const session = await getSessionUser();

  if (!session) return fail("unauthorized");

  if (session.accountType === "admin" && session.aal !== "aal2") return fail("aal2_required");

  const client = await createServerSupabase();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user?.email) return fail("unauthorized");
  const verifier = createIsolatedAuthClient();

  const verified = await verifier.auth.signInWithPassword({
    email: data.user.email,
    password: parsed.output.currentPassword,
  });

  if (verified.error) return fail(toErrorCode(verified.error, "verifyCurrentPassword"));

  if (verified.data.user.id !== data.user.id) return fail("forbidden");
  const closed = await verifier.auth.signOut({ scope: "local" });

  if (closed.error) return fail(toErrorCode(closed.error, "closePasswordVerification"));
  const updated = await client.auth.updateUser({ password: parsed.output.password });

  if (updated.error) return fail(toErrorCode(updated.error, "changePassword"));
  // 共有アカウントの古いログインも終了し、変更後のパスワードで入り直す。
  const signedOut = await client.auth.signOut({ scope: "global" });

  if (signedOut.error) return fail(toErrorCode(signedOut.error, "signOutAfterPasswordChange"));

  return succeed(null);
}
