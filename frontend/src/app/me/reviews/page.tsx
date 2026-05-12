import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { ReviewCard, type MyReview } from "./_components/review-card";

const REVIEWER_ROLES = new Set(["farmer", "researcher", "ja_staff"]);
const PAGE_SIZE = 20;

type MyReviewsResponse = {
  reviews: MyReview[];
  total: number;
};

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function MyReviewsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const user = await getUser();
  if (!user) {
    redirect("/login?next=/me/reviews");
  }
  const role = await getRole(user);
  if (role === null || !REVIEWER_ROLES.has(role)) {
    redirect(landingPathForRole(role));
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/me/reviews");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(
    `${apiUrl}/v1/me/reviews?page=${page}&limit=${PAGE_SIZE}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch my reviews: ${res.status}`);
  }
  const { reviews, total } = (await res.json()) as MyReviewsResponse;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            自分のレビュー
          </h1>
          <p className="text-sm text-muted-foreground">{total} 件</p>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-10 text-center space-y-4">
            <p className="text-lg font-medium">
              まだレビューを投稿していません。
            </p>
            <Button asChild>
              <Link href="/products">気になる資材を探す</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-3 pt-4"
            aria-label="ページネーション"
          >
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/me/reviews?page=${page - 1}`}>前のページ</Link>
              </Button>
            ) : (
              <span className="w-[88px]" aria-hidden />
            )}
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/me/reviews?page=${page + 1}`}>次のページ</Link>
              </Button>
            ) : (
              <span className="w-[88px]" aria-hidden />
            )}
          </nav>
        )}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-4xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
