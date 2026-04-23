import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSignUpRole } from "@/lib/auth/roles";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  if (!isSignUpRole(body.role)) {
    return NextResponse.json(
      { ok: false, error: "invalid_role" },
      { status: 400 },
    );
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "api_url_not_configured" },
      { status: 500 },
    );
  }

  const upstream = await fetch(`${apiUrl}/v1/auth/register-role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ role: body.role }),
  });

  const upstreamBody = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: upstreamBody?.error ?? upstreamBody?.detail ?? "upstream_error" },
      { status: upstream.status },
    );
  }

  await supabase.auth.refreshSession();

  return NextResponse.json({ ok: true, role: body.role });
}
