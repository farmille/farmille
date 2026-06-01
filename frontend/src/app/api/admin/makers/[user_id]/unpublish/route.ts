import { proxyToBackend } from "@/lib/admin-proxy";

// 2026-05-27: 公開済 maker を再び非公開 (status=pending_review) に戻すトグル side。

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> },
) {
  const { user_id } = await params;
  return proxyToBackend(
    `/v1/admin/makers/${encodeURIComponent(user_id)}/unpublish`,
    { method: "POST" },
  );
}
