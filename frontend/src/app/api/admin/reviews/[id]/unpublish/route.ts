import { proxyToBackend } from "@/lib/admin-proxy";

// 非公開化 (stage1 / 2026-06-29): pending|approved → rejected。承認済の取り下げ用。
// reject (pending 限定) と違い公開後のレビューも非公開に戻せる。理由は任意。
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(
    `/v1/admin/reviews/${encodeURIComponent(id)}/unpublish`,
    { method: "POST", body },
  );
}
