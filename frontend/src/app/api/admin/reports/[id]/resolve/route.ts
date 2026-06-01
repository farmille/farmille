import { proxyToBackend } from "@/lib/admin-proxy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(
    `/v1/admin/reports/${encodeURIComponent(id)}/resolve`,
    { method: "POST", body },
  );
}
