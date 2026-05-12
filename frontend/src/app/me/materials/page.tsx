import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { isReviewerRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { type FavoriteItem } from "./_components/favorite-card";
import { FavoritesTab } from "./_components/favorites-tab";
import { RequestsPlaceholder } from "./_components/requests-placeholder";

export const metadata: Metadata = {
  title: "マイ資材",
  description: "お気に入り資材と候補資材を管理する個人ページ",
};

const VALID_TABS = ["favorite", "candidate", "requests"] as const;
type TabKey = (typeof VALID_TABS)[number];

type FavoritesResponse = { favorites: FavoriteItem[] };

type PageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

function parseTab(raw: string | undefined): TabKey {
  if (raw && (VALID_TABS as readonly string[]).includes(raw)) {
    return raw as TabKey;
  }
  return "favorite";
}

export default async function MyMaterialsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const tab = parseTab(params.tab);

  // spec §6.1 / ADR-0006: 未ログイン → /login、reviewer 以外 → landing redirect
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/me/materials");
  }
  const role = await getRole(user);
  if (!isReviewerRole(role)) {
    redirect(landingPathForRole(role));
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/me/materials");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  // spec §6.1: requests タブは API 呼び出しゼロ (§13)。
  // favorite / candidate タブのみ実 fetch。
  let favoriteItems: FavoriteItem[] = [];
  let candidateItems: FavoriteItem[] = [];

  if (tab === "favorite" || tab === "candidate") {
    const kind = tab;
    const res = await fetch(
      `${apiUrl}/v1/me/favorites?kind=${kind}&limit=200`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch favorites: ${res.status}`);
    }
    const { favorites } = (await res.json()) as FavoritesResponse;
    if (kind === "favorite") {
      favoriteItems = favorites;
    } else {
      candidateItems = favorites;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">マイ資材</h1>
          <p className="text-sm text-muted-foreground">
            気になる資材を「お気に入り」と「候補」で管理できます。
          </p>
        </div>

        <nav
          className="flex flex-wrap gap-2 border-b border-border"
          aria-label="マイ資材タブ"
        >
          <TabLink current={tab} target="favorite" label="お気に入り" />
          <TabLink current={tab} target="candidate" label="候補" />
          <TabLink current={tab} target="requests" label="問い合わせ履歴" />
        </nav>

        {tab === "favorite" && (
          <FavoritesTab
            items={favoriteItems}
            emptyHeadline="まだお気に入り資材がありません"
            emptyHelpText="気になる資材を「お気に入り」に追加すると、ここに一覧されます。"
          />
        )}
        {tab === "candidate" && (
          <FavoritesTab
            items={candidateItems}
            emptyHeadline="まだ候補資材がありません"
            emptyHelpText="購入や試用を検討中の資材を「候補」に追加すると、ここに集まります。"
          />
        )}
        {tab === "requests" && <RequestsPlaceholder />}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-4xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}

function TabLink({
  current,
  target,
  label,
}: {
  current: TabKey;
  target: TabKey;
  label: string;
}) {
  const active = current === target;
  return (
    <Link
      href={`/me/materials?tab=${target}`}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "px-4 py-2 -mb-px border-b-2 border-primary text-primary text-sm font-medium"
          : "px-4 py-2 -mb-px border-b-2 border-transparent text-muted-foreground hover:text-foreground text-sm"
      }
    >
      {label}
    </Link>
  );
}
