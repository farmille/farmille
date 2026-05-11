import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Phase 19 BFF proxy:
//   - PUT /api/me/profile  → backend PUT /v1/me/profile
//   - GET は Server Component が直接 backend を叩くため未提供 (既存パターン
//     /me/reviews と統一)。
//   - 旧 avatar の Storage 削除責務は backend 側 (frontend からは
//     supabase.storage.remove() を一切呼ばない、spec §6.3)。

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

export async function PUT(request: NextRequest) {
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

  const upstream = await fetch(`${apiUrl}/v1/me/profile`, {
    method: "PUT",
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
      },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ ok: true });
}
