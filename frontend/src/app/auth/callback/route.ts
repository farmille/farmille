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
  }

  return NextResponse.redirect(new URL("/onboarding", origin));
}
