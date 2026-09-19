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
 * 文面の `token_hash` + `type` の両方を受け、セッション cookie を張ってから
 * `next`（同一サイトの path のみ）へ戻す。失敗時はログイン画面へ理由付きで戻す。
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next")) ?? "/";

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
