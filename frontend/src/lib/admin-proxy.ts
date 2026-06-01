import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 2026-05-27 追加: admin proxy routes の共通ヘルパ。
 * Bearer token を inject して FastAPI に転送、エラーを正規化して返す。
 *
 * 多層防御 (ADR-0009 / ADR-0012): /v1/admin/* への転送は BFF でも admin role +
 * AAL2 を検証する。権威ゲートは FastAPI 側 require_role("admin") + AAL2 だが、
 * proxy が「ログイン済か」しか見ないと不変条件が嘘になり将来の穴になるため。
 */
export async function proxyToBackend(
  upstreamPath: string,
  options: {
    // 2026-06-02 (Admin Articles CMS): GET を追加。read 系 proxy route handler でも
    // admin+AAL2 を BFF で再検証してから FastAPI に転送するため。
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    /** admin role + AAL2 を要求するか。既定で /v1/admin/* を自動 admin 扱い。 */
    requireAdmin?: boolean;
  },
) {
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

  // /v1/admin/* は role + AAL2 をここでも弾く (非 admin の /v1/reports 等は対象外)。
  // ⚠️ 申し送り (PR#33 evaluator §4.3): GET 拡張により、将来 /v1/admin/ 以外の path で
  //    GET proxy を書くと requireAdmin が false=「ログイン済のみ」で素通る。非 admin path の
  //    GET proxy を足すときは requireAdmin を明示するか、認可方針を必ず設計すること。
  const requireAdmin =
    options.requireAdmin ?? upstreamPath.startsWith("/v1/admin/");
  if (requireAdmin) {
    if (user.app_metadata?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      return NextResponse.json(
        { ok: false, error: "aal2_required" },
        { status: 403 },
      );
    }
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

  // GET は body / Content-Type を付けない (一部サーバーが GET+body を 400 にするため)。
  const isGet = options.method === "GET";
  const upstream = await fetch(`${apiUrl}${upstreamPath}`, {
    method: options.method,
    headers: isGet
      ? { Authorization: `Bearer ${session.access_token}` }
      : {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
    body:
      !isGet && options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    cache: "no-store",
  });

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
