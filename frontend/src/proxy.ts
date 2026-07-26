import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/env";
import { decideAuthRedirect } from "@/lib/auth/protected-paths";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Supabase のセッション cookie を更新しつつ、保護パスの出入りを制御する（03 §2）。
 * 公開ページ（D6）は素通しする。ロール・AAL の判定はここでは行わない。
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pendingCookies: PendingCookie[] = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          // 後続のハンドラが新しいトークンを読めるようリクエスト側も更新する。
          request.cookies.set(name, value);
          pendingCookies.push({ name, value, options });
        }
        Object.assign(pendingHeaders, headers);
      },
    },
  });

  // getClaims() が期限切れのアクセストークンを更新し、setAll 経由で cookie を書き戻す。
  const { data, error } = await supabase.auth.getClaims();
  const isSignedIn = error === null && data !== null;

  const { pathname, search } = request.nextUrl;
  const redirectTo = decideAuthRedirect(pathname, `${pathname}${search}`, isSignedIn);

  const response =
    redirectTo === null
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL(redirectTo, request.url));

  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }
  // 認証 cookie を載せた応答は CDN にキャッシュさせない（@supabase/ssr が指定するヘッダ）。
  for (const [name, value] of Object.entries(pendingHeaders)) {
    response.headers.set(name, value);
  }

  return response;
}

export const config = {
  matcher: [
    // 静的アセットと画像最適化を除いた全リクエスト。セッション更新を全ページで行う。
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
