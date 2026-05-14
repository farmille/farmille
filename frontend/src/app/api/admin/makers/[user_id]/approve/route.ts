import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// spec §6.3: /admin/makers Client Island からの承認リクエスト proxy。
// Authorization Bearer を付け直して FastAPI /v1/admin/makers/{id}/approve に転送する。
// 既存 /api/me/favorites パターンに合わせる。

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> },
) {
  const { user_id } = await params;

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

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "api_url_not_configured" },
      { status: 500 },
    );
  }

  const upstream = await fetch(
    `${apiUrl}/v1/admin/makers/${encodeURIComponent(user_id)}/approve`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );
  const body = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: body?.error ?? body?.detail ?? "upstream_error",
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json(body);
}
