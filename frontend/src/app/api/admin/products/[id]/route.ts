import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// spec admin-aglist-alignment-v2.md §3.2: Client Island からの編集リクエストを
// FastAPI /v1/admin/products/{id} に proxy する。
// 既存 /api/admin/makers/[user_id]/approve のパターンに合わせ Authorization Bearer
// を付け直して転送する (Supabase SDK 直叩きは禁止)。

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
    `${apiUrl}/v1/admin/products/${encodeURIComponent(id)}`,
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
