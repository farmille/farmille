import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { authorizeGeneralUser, getSessionUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { getOwnProfile } from "@/server/queries/profiles";
import { ProfileSetupForm } from "./ProfileSetupForm";

export const metadata: Metadata = { title: "個人プロフィールの設定", robots: NO_INDEX_ROBOTS };

export default async function ProfileSetupPage() {
  const session = authorizeGeneralUser(await getSessionUser());
  if (!session.ok) {
    if (session.error === "unauthorized") redirect("/login?next=%2Fme%2Fsetup");
    redirect("/me");
  }
  const profile = await getOwnProfile(session.data.userId);
  if (profile.ok) redirect("/me");
  if (profile.error !== "not_found") throw new Error(errorMessageJa[profile.error]);
  return (
    <AuthScreen
      title="個人プロフィールの設定"
      lead="レビューや検討リストを使うための設定です。運営権限とログイン情報はそのまま使えます。"
    >
      <ProfileSetupForm />
    </AuthScreen>
  );
}
