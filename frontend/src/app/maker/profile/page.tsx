import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { landingPathForRole } from "@/lib/auth/landing";
import {
  ProfileForm,
  type MakerProfileInitial,
} from "./_components/profile-form";

type ProfileResponse = {
  user_id: string;
  company_name: string;
  prefecture: string | null;
  city: string | null;
  note: string | null;
};

export default async function MakerProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/maker/profile");
  }
  const role = await getRole();
  if (role !== "maker") {
    redirect(landingPathForRole(role));
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/maker/profile");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(`${apiUrl}/v1/maker/profile`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });

  if (res.status === 404) {
    // Onboarding incomplete: bounce to the existing onboarding flow rather
    // than rendering a placeholder edit page (spec §6.3).
    redirect("/onboarding/maker");
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch maker profile: ${res.status}`);
  }

  const profile = (await res.json()) as ProfileResponse;
  const initial: MakerProfileInitial = {
    company_name: profile.company_name,
    prefecture: profile.prefecture,
    city: profile.city,
    note: profile.note,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            企業プロフィール編集
          </h1>
          <p className="text-base text-muted-foreground">
            ここで編集した内容は公開ページ (/manufacturers) に反映されます。
          </p>
        </div>

        <div
          className="border border-border bg-card p-8"
          style={{
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <ProfileForm initial={initial} />
        </div>
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
