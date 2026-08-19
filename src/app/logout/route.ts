import { NextResponse, type NextRequest } from "next/server";

import { sameOriginUrl } from "@/lib/http/request-url";
import { signOut } from "@/server/accounts/session";
import { fail, toResponse } from "@/server/result";

/**
 * Origin ヘッダのホストとリクエストの Host が一致するかを見る。
 * nextUrl.origin は開発サーバーで正規化されるため、生ヘッダで比較する。
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin === null || host === null) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * ログアウト。GET では受け付けず、同一オリジンからの POST だけを通す（CSRF 対策）。
 * 画面側は `<form method="post" action="/logout">` から呼ぶ。
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) {
    return toResponse(fail("forbidden"));
  }

  const result = await signOut();

  if (!result.ok) return toResponse(result);

  return NextResponse.redirect(sameOriginUrl(request, "/"), { status: 303 });
}
