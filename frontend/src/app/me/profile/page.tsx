import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { MeNav } from "./_components/me-nav";
import { ProfileCard, type MeProfile } from "./_components/profile-card";

// Phase 19 /me/profile (本人ビュー、farmer ロール限定)。
// アクセス制御は spec §6.1 / §1.1 の通り:
//   - 未ログイン → /login?next=/me/profile
//   - maker → /maker/products (Phase 17 未着工のため maker 着地 path に倣う)
//   - unassigned → /onboarding
//   - ja_staff / researcher → 403 + 案内 (本 page で expressly レンダ)
//   - profile_not_found (onboarding 未完了 farmer) → onboarding 案内
// 公開プロフ /u/{username} は spec §13 で対象外、本 page は本人専用。

const ONBOARDING_PATH = "/onboarding";
const MAKER_LANDING = "/maker/products";

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
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          プロフィール
        </h1>
        <p className="text-sm text-muted-foreground">
          v1 ではプロフィール画面は farmer ロールのみ対応しています。
          ja_staff / researcher 向けのプロフィール表示は今後の phase で
          検討します。
        </p>
        <Button asChild variant="outline">
          <Link href="/me/reviews">自分のレビューを見る</Link>
        </Button>
      </main>
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
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-6">
          <MeNav pathnameOverride="/me/profile" />
          <div className="rounded-md border border-border bg-card p-10 text-center space-y-4">
            <h2 className="text-lg font-medium">
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
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full space-y-6">
        <MeNav pathnameOverride="/me/profile" />
        <ProfileCard profile={profile} />
      </main>
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-3xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Farmille
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/products"
            className="text-foreground hover:text-primary"
          >
            資材一覧
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/home">ホーム</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
