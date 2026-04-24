import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAuth() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getAuth();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

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

  const upstream = await fetch(
    `${apiUrl}/v1/reviews/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
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

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getAuth();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "api_url_not_configured" },
      { status: 500 },
    );
  }

  const upstream = await fetch(
    `${apiUrl}/v1/reviews/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const upstreamBody = await upstream.json().catch(() => ({}));
  return NextResponse.json(
    {
      ok: false,
      error: upstreamBody?.error ?? upstreamBody?.detail ?? "upstream_error",
    },
    { status: upstream.status },
  );
}
