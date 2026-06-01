import { proxyToBackend } from "@/lib/admin-proxy";

// 2026-06-01: /delete は backend でソフト削除 (users.deleted_at + status='frozen' + auth ban)。
// users 行は残し通報監査ログを保持、公開面からは非表示。物理削除はしない。

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ user_id: string }> },
) {
  const { user_id } = await params;
  return proxyToBackend(
    `/v1/admin/users/${encodeURIComponent(user_id)}/delete`,
    { method: "POST" },
  );
}
