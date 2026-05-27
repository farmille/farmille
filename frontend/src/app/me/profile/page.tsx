import Link from "next/link";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { MeNav } from "./_components/me-nav";
import { ProfileCard, type MeProfile } from "./_components/profile-card";

// Phase 19 /me/profile (本人ビュー、farmer ロール限定)。
// アクセス制御は spec §6.1 / §1.1 の通り:
//   - 未ログイン → /login?next=/me/profile
//   - maker → /maker/profile (spec §6.1 / §10.4、Phase 17 PR で /maker/profile を実装済)
//   - unassigned → /onboarding
//   - ja_staff / researcher → 403 + 案内 (本 page で expressly レンダ)
//   - profile_not_found (onboarding 未完了 farmer) → onboarding 案内
// 公開プロフ /u/{username} は spec §13 で対象外、本 page は本人専用。

const ONBOARDING_PATH = "/onboarding";
const MAKER_LANDING = "/maker/profile";

// AgList-inspired hero band shared by all states (success / 404 / 403).
function ProfileHero({ subtitle }: { subtitle: string }) {
  return (
    <section
      aria-label="ページヘッダー"
      className="border-b border-border"
      style={{ backgroundColor: "var(--green-subtle)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: "var(--overlay-on-light-soft)",
            color: "var(--green-dark)",
            borderRadius: "var(--radius-full)",
          }}
        >
          <User className="h-3.5 w-3.5" aria-hidden="true" />
          マイページ
        </div>
        <h1
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
          style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
        >
          プロフィール
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl">{subtitle}</p>
      </div>
    </section>
  );
}

export default async function MyProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/me/profile");
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
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <ProfileHero subtitle="v1 ではプロフィール画面は farmer ロールのみ対応しています。ja_staff / researcher 向けのプロフィール表示は今後の phase で検討します。" />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
          <Button asChild variant="outline">
            <Link href="/me/reviews">自分のレビューを見る</Link>
          </Button>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/me/profile");
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
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <ProfileHero subtitle="まずはプロフィールを設定してください。都道府県・市町村・主な作目を登録すると、レビューの投稿やプロフィール公開ができるようになります。" />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-6">
          <MeNav pathnameOverride="/me/profile" />
          <div
            className="border border-border bg-card p-10 text-center space-y-4"
            style={{
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h2 className="text-lg font-semibold text-foreground">
              まずはプロフィールを設定してください
            </h2>
            <p className="text-sm text-muted-foreground">
              都道府県・市町村・主な作目を登録すると、レビューの投稿や
              プロフィール公開ができるようになります。
            </p>
            <Button asChild>
              <Link href={ONBOARDING_PATH}>オンボーディングを始める</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch /v1/me/profile: ${res.status}`);
  }

  const profile = (await res.json()) as MeProfile;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ProfileHero subtitle="登録した都道府県・市町村・主な作目と、これまでのレビュー活動を確認できます。" />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-6">
        <MeNav pathnameOverride="/me/profile" />
        <ProfileCard profile={profile} />
      </main>
    </div>
  );
}
