import type { AdminActionState } from "@/app/admin/_lib/action-state";
export async function removePublishedPostAction(): Promise<AdminActionState> {
  return {
    status: "done",
    message: "公開から削除しました。投稿内容は運営の記録として保持されています。",
  };
}
