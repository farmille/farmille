import { proxyToBackend } from "@/lib/admin-proxy";

// レビュー承認フロー (2026-06-13): pending → rejected (非公開、却下理由は任意)。
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(
    `/v1/admin/reviews/${encodeURIComponent(id)}/reject`,
    { method: "POST", body },
  );
}
