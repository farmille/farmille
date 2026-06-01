import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/admin-proxy";

// Admin Articles CMS (ADR-0014)。
// GET  /api/admin/articles  → /v1/admin/articles  (一覧、下書き含む)
// POST /api/admin/articles  → /v1/admin/articles  (作成)
// 権威ゲートは FastAPI 側 require_role("admin") + AAL2。proxyToBackend が BFF でも
// admin+AAL2 を再検証する (多層防御)。Supabase SDK の DATA 直叩きは禁止。

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search; // ?page=&per_page= を素通し
  return proxyToBackend(`/v1/admin/articles${search}`, { method: "GET" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend("/v1/admin/articles", { method: "POST", body });
}
