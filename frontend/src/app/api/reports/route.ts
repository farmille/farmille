import { proxyToBackend } from "@/lib/admin-proxy";

// 公開 POST /v1/reports への proxy (logged in user 必須)。
// service_role を露出させないため、frontend → BFF → backend は変えない。

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(`/v1/reports`, { method: "POST", body });
}
