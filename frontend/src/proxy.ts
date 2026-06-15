import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/auth/roles";

const PROTECTED_PATHS = ["/home", "/onboarding"];
const GUEST_ONLY_PATHS = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  // SiteHeader (Server Component) が pathname を参照できるよう、リクエストヘッダに転送する。
  // Next.js は server-side で pathname を直接取れないため、proxy で `x-pathname` を付ける。
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.app_metadata?.role ?? null) as Role | null;
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isGuestOnly = GUEST_ONLY_PATHS.some((p) => pathname.startsWith(p));

  // 2026-06-13 ログイン間欠不具合の修正:
  // supabase.auth.getUser() がトークンを更新すると setAll が `response` に新しい
  // Set-Cookie を載せる。ところが従来はリダイレクト時に素の NextResponse.redirect を
  // 返しており、その更新後 cookie を引き継いでいなかった。Supabase の refresh token は
  // 単回使用(回転)なので、更新後 cookie を落とすと次回リクエストで回転前トークンが使われ
  // 401 → セッション切れ＝「ログインが毎回事故る」系の典型原因になる。
  // リダイレクト応答にも必ず `response` の cookie を複製して引き継ぐ。
  const redirectTo = (path: string) => {
    const redirectRes = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  };

  if (!user && isProtected) {
    return redirectTo("/login");
  }

  if (user && isGuestOnly) {
    const dest = role === "unassigned" ? "/onboarding" : "/home";
    return redirectTo(dest);
  }

  if (user && role === "unassigned" && pathname.startsWith("/home")) {
    return redirectTo("/onboarding");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron).*)"],
};
