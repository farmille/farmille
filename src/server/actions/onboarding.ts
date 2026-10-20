"use server";

import { requireGeneralUser } from "@/server/auth";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";

/**
 * 初回ログインの案内を終えた印として、アカウントの app_metadata.onboarding を消す（null を渡すと消える）。
 * 本番では Server Action が投げた例外の文言はクライアントへ届かないので、失敗はエラーコードで返す。
 */
export async function finishOnboardingAction(): Promise<Result<null>> {
  const session = await requireGeneralUser();
  if (!session.ok) return session;
  const { error } = await createAdminSupabase().auth.admin.updateUserById(session.data.userId, {
    app_metadata: { onboarding: null },
  });
  return error ? fail(toErrorCode(error, "finishOnboarding")) : succeed(null);
}
