import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// B6 admin users — role 変更 proxy。
// /admin/users Client Island から呼び出され、Authorization Bearer を付け直して
// FastAPI POST /v1/admin/users/{id}/role に転送する (既存 /api/admin/makers/.../approve と同パターン)。
// backend 側は ASSIGNABLE_ROLES = admin / ja_staff / researcher のみ受け付ける。

type Body = { role: "admin" | "ja_staff" | "researcher" };

export async function POST(
  req: Request,
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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
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
    `${apiUrl}/v1/admin/users/${encodeURIComponent(user_id)}/role`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: body.role }),
    },
  );
  const respBody = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: respBody?.error ?? respBody?.detail ?? "upstream_error",
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json(respBody);
}
