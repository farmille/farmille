import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// spec §6.3: /admin/makers Client Island からの却下リクエスト proxy。
// body.reason は backend で破棄されるが互換のため転送する (spec §5.4)。

export async function POST(
  request: NextRequest,
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

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "api_url_not_configured" },
      { status: 500 },
    );
  }

  const upstream = await fetch(
    `${apiUrl}/v1/admin/makers/${encodeURIComponent(user_id)}/reject`,
    {
      method: "POST",
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
        error:
          upstreamBody?.error ?? upstreamBody?.detail ?? "upstream_error",
      },
      { status: upstream.status },
    );
  }
  return NextResponse.json(upstreamBody);
}
