import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";

// 薄い server redirect ラッパ。外部リンク・bookmark 互換のため残置。
// 内部遷移は各 page / Server Action から landingPathForRole 経由で
// 直接最終 path に飛ぶため本ページに到達しない（ホップ削減）。
export default async function HomePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getRole();
  redirect(landingPathForRole(role));
}
