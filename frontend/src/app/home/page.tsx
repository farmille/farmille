import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { isMakerRole, isReviewerRole } from "@/lib/auth/roles";

// 薄い server redirect ラッパ。既存の redirect("/home") 呼び出し互換のため残置。
// 通常の signup / login flow では actions.ts / onboarding/complete から
// 直接 role 別の最終 path に飛ぶため本ページに到達しない。
export default async function HomePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getRole();
  if (isMakerRole(role)) {
    redirect("/maker/products");
  }
  if (isReviewerRole(role)) {
    redirect("/products");
  }
  redirect("/onboarding");
}
