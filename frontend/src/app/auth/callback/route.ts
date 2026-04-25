import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSignUpRole } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", origin),
    );
  }

  const intendedRole = data.user?.user_metadata?.intended_role as unknown;
  const next = url.searchParams.get("next");

  if (isSignUpRole(intendedRole)) {
    const completeRes = await fetch(`${origin}/api/auth/complete-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({ role: intendedRole }),
    });

    if (!completeRes.ok) {
      return NextResponse.redirect(
        new URL("/onboarding?recover=1", origin),
      );
    }

    // register-role 成功 → intended_role が確定しているので
    // /onboarding/{role} に直接着地させ、再選択フォームを経由させない。
    // /onboarding/{role} ページは FastAPI /v1/onboarding/status で role を
    // DB から取得するため、JWT cookie の鮮度に依存しない。
    return NextResponse.redirect(
      new URL(`/onboarding/${intendedRole}`, origin),
    );
  }

  // password recovery 等で next= が付いている場合はその path に着地
  // 相対 path のみ許容（外部 URL への redirect は禁止）
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(new URL(next, origin));
  }

  // intended_role が読み取れない場合のみ /onboarding（ロール選択フォーム）にフォールバック
  return NextResponse.redirect(new URL("/onboarding", origin));
}
