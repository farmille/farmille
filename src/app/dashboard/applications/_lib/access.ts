import { redirect } from "next/navigation";
import { applicationResult, approvedApplicationSeller } from "@/server/company-application-auth";

export async function applicationSellerPage(next: string) {
  const result = await applicationResult(approvedApplicationSeller);
  if (result.ok) return result.data;
  if (result.error === "unauthorized") redirect(`/sellers/login?next=${encodeURIComponent(next)}`);
  if (result.error === "forbidden") return null;
  throw new Error("メーカーアカウントの確認に失敗しました。");
}
