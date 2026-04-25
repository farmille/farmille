import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
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

  const sp = request.nextUrl.searchParams;
  const qs = new URLSearchParams();
  const page = sp.get("page");
  const limit = sp.get("limit");
  if (page) qs.set("page", page);
  if (limit) qs.set("limit", limit);
  const qsStr = qs.toString();

  const upstream = await fetch(
    `${apiUrl}/v1/me/reviews${qsStr ? `?${qsStr}` : ""}`,
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
