import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";

// 2026-05-27: signup で role が確定セットされる新フローに移行 (backend `/v1/auth/signup`)。
// 本ページは「role 選択フォーム」を **二度と表示しない**。万一 role 未確定で
// 着地した場合は再ログインを誘導 (JWT 更新でリカバリ)。
//
// 旧フォーム表示分は role-recovery-form.tsx に残置だが本ページからは未参照。

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getRole();
  if (role === "farmer") {
    redirect("/onboarding/farmer");
  }
  if (role === "maker") {
    redirect("/onboarding/maker");
  }
  if (role === "admin" || role === "ja_staff" || role === "researcher") {
    redirect(landingPathForRole(role));
  }

  // unassigned / 不明: signup 直後 JWT に role が乗っていない端末 (cross-browser email
  // 確認等の取りこぼし)。再ログインで app_metadata.role を取り直し、本ページに戻らない。
  redirect("/login?next=/&relogin=role_refresh");
}
