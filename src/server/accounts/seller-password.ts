import * as v from "valibot";

import { syntheticSellerEmail, LOGIN_ID_PATTERN } from "@/server/accounts/seller";
import { requestPasswordReset } from "@/server/accounts/session";
import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase } from "@/server/supabase";

export const SellerRecoverySchema = v.object({
  loginId: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.regex(LOGIN_ID_PATTERN)),
  email: v.pipe(v.string(), v.trim(), v.email()),
});

export async function requestSellerPasswordReset(
  input: v.InferOutput<typeof SellerRecoverySchema>,
): Promise<Result<null>> {
  const parsed = v.safeParse(SellerRecoverySchema, input);

  if (!parsed.success) return fail("invalid_body");
  const db = createAdminSupabase();

  const result = await db
    .from("seller_accounts")
    .select("contact_email,auth_user_id,status")
    .eq("login_id", parsed.output.loginId)
    .maybeSingle();

  if (result.error) return fail("internal");
  const seller = result.data;

  if (
    !seller ||
    seller.status !== "approved" ||
    !seller.auth_user_id ||
    seller.contact_email.toLowerCase() !== parsed.output.email.toLowerCase()
  )
    return succeed(null);
  const email = syntheticSellerEmail(parsed.output.loginId);

  if (!email) return fail("invalid_body");

  return requestPasswordReset(email);
}
