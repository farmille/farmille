import { proxyToBackend } from "@/lib/admin-proxy";

// Admin Articles CMS (ADR-0014)。
// GET    /api/admin/articles/{id} → /v1/admin/articles/{id}  (詳細)
// PATCH  /api/admin/articles/{id} → /v1/admin/articles/{id}  (部分更新)
// DELETE /api/admin/articles/{id} → /v1/admin/articles/{id}  (削除)

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(`/v1/admin/articles/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(`/v1/admin/articles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(`/v1/admin/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
