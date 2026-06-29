import { proxyToBackend } from "@/lib/admin-proxy";

// ハード削除 (stage1 / 2026-06-29): admin がレビューを物理削除する。復元不可。
// BFF で admin role + AAL2 を再検証してから FastAPI の DELETE /v1/admin/reviews/{id} へ。
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(`/v1/admin/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
