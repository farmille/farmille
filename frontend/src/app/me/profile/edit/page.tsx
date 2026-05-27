import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { MeNav } from "../_components/me-nav";
import type { MeProfile } from "../_components/profile-card";
import { ProfileForm } from "./_components/profile-form";

// Phase 19 /me/profile/edit (本人ビュー、farmer ロール限定)。
// 既存プロフィール取得後、ProfileForm に流し込む。
// アクセス制御は /me/profile と同条件 (spec §6.2)。

const ONBOARDING_PATH = "/onboarding";
const MAKER_LANDING = "/maker/profile";

export default async function MyProfileEditPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/me/profile/edit");
  }
  const role = await getRole(user);

  if (role === "maker") {
    redirect(MAKER_LANDING);
  }
  if (role === null || role === "unassigned") {
    redirect(ONBOARDING_PATH);
  }
  if (role !== "farmer") {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          プロフィール編集
        </h1>
        <p className="text-sm text-muted-foreground">
          v1 ではプロフィール編集は farmer ロールのみ対応しています。
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/me/profile/edit");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(`${apiUrl}/v1/me/profile`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });

  if (res.status === 404) {
    redirect(ONBOARDING_PATH);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/me/profile: ${res.status}`);
  }

  const profile = (await res.json()) as MeProfile;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-6">
        <MeNav pathnameOverride="/me/profile" />
        <h1 className="text-2xl font-semibold tracking-tight">
          プロフィール編集
        </h1>
        <ProfileForm profile={profile} />
      </main>
    </div>
  );
}
