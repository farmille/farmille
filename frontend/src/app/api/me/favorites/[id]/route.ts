import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    `${apiUrl}/v1/me/favorites/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
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
