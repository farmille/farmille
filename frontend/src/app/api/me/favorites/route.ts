import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await getAuth();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "api_url_not_configured" },
      { status: 500 },
    );
  }

  const sp = request.nextUrl.searchParams;
  const qs = new URLSearchParams();
  const kind = sp.get("kind");
  const limit = sp.get("limit");
  if (kind) qs.set("kind", kind);
  if (limit) qs.set("limit", limit);
  const qsStr = qs.toString();

  const upstream = await fetch(
    `${apiUrl}/v1/me/favorites${qsStr ? `?${qsStr}` : ""}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  const upstreamBody = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: upstreamBody?.error ?? upstreamBody?.detail ?? "upstream_error",
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json(upstreamBody);
}

export async function POST(request: NextRequest) {
  const session = await getAuth();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
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

  const upstream = await fetch(`${apiUrl}/v1/me/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const upstreamBody = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: upstreamBody?.error ?? upstreamBody?.detail ?? "upstream_error",
        code: upstreamBody?.code,
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json(upstreamBody, { status: 201 });
}
