import { createIsolatedAuthClient, createAdminSupabase } from "@/server/supabase";
import { saveRegistrationProof } from "@/server/accounts/registration-proof";
import { registrationIdentity } from "@/server/accounts/general";
import { sendPendingRegistrationEmail } from "@/server/accounts/notification-email";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/safe-next";
import { sameOriginUrl } from "@/lib/http/request-url";
import { exchangeAuthCode, isEmailOtpType, verifyEmailOtp } from "@/server/accounts/session";
import type { Result } from "@/server/result";
import { fail } from "@/server/result";

/**
 * メール確認・パスワード再設定リンクの受け口。
 * PKCE フローの `code`（Supabase 既定のメール文面）と、token_hash 形式に差し替えた
 * 文面の `token_hash` + `type` の両方を受ける。登録用リンクでは本人証明だけを保存し、
 * ほかの認証リンクでは通常のセッションを設定して `next` へ戻す。
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next")) ?? "/";

  if (
    searchParams.get("registration") === "1" ||
    type === "signup" ||
    type === "magiclink" ||
    type === "email"
  ) {
    const client = createIsolatedAuthClient();

    const verified =
      code !== null
        ? await client.auth.exchangeCodeForSession(code)
        : tokenHash !== null && (type === "signup" || type === "magiclink" || type === "email")
          ? await client.auth.verifyOtp({ type, token_hash: tokenHash })
          : null;

    if (!verified || verified.error || !verified.data.user) {
      const expired =
        next === "/"
          ? "/signup/general?error=expired_link"
          : `/signup/general?error=expired_link&next=${encodeURIComponent(next)}`;

      return NextResponse.redirect(sameOriginUrl(request, expired));
    }

    const identity = await registrationIdentity(verified.data.user.id, createAdminSupabase());
    const closed = await client.auth.signOut({ scope: "local" });

    if (closed.error) throw new Error("メール確認用セッションを終了できませんでした。");

    if (!identity.ok)
      return NextResponse.redirect(
        sameOriginUrl(request, `/signup/general?error=${identity.error}`),
      );
    await saveRegistrationProof(identity.data.userId, identity.data.email);

    const destination =
      next === "/" ? "/signup/complete" : `/signup/complete?next=${encodeURIComponent(next)}`;

    return NextResponse.redirect(sameOriginUrl(request, destination));
  }

  const result = await verifyLink({ code, tokenHash, type });

  if (!result.ok) {
    return NextResponse.redirect(sameOriginUrl(request, `/login?error=${result.error}`));
  }

  await sendPendingRegistrationEmail();

  return NextResponse.redirect(sameOriginUrl(request, next));
}

async function verifyLink({
  code,
  tokenHash,
  type,
}: {
  code: string | null;
  tokenHash: string | null;
  type: string | null;
}): Promise<Result<null>> {
  if (code !== null) return exchangeAuthCode(code);

  if (tokenHash !== null && isEmailOtpType(type)) return verifyEmailOtp(type, tokenHash);

  return fail("expired_link");
}
