"use server";

import { requireGeneralUser } from "@/server/auth";
import { toErrorCode } from "@/server/accounts/auth-errors";
import { errorMessageJa } from "@/server/errors";
import { createAdminSupabase } from "@/server/supabase";

/** 初回ログインの案内を終えた印として、アカウントの app_metadata.onboarding を消す（null を渡すと消える）。 */
export async function finishOnboardingAction(): Promise<void> {
  const session = await requireGeneralUser();
  if (!session.ok) throw new Error(errorMessageJa[session.error]);
  const { error } = await createAdminSupabase().auth.admin.updateUserById(session.data.userId, {
    app_metadata: { onboarding: null },
  });
  if (error) throw new Error(errorMessageJa[toErrorCode(error, "finishOnboarding")]);
}
