import { proxyToBackend } from "@/lib/admin-proxy";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(`/v1/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
