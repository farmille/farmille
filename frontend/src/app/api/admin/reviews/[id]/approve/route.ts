import { proxyToBackend } from "@/lib/admin-proxy";

// レビュー承認フロー (2026-06-13): pending → approved (公開)。
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(
    `/v1/admin/reviews/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
  );
}
