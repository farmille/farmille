import { proxyToBackend } from "@/lib/admin-proxy";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> },
) {
  const { user_id } = await params;
  return proxyToBackend(`/v1/admin/users/${encodeURIComponent(user_id)}/freeze`, {
    method: "POST",
  });
}
