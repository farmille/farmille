import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Atom,
  Workflow,
  Sparkles,
  Sprout,
  BadgeCheck,
  Tag as TagIcon,
  FileText,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, getRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./_components/review-form";
import { ReviewWithProfileGate } from "./_components/review-with-profile-gate";
import { MyReviewRow } from "./_components/my-review-row";
import {
  FavoriteButton,
  type ExistingFavorite,
  type FavoriteKind,
} from "./_components/favorite-button";
import { isReviewerRole } from "@/lib/auth/roles";
import type {
  CategoryL1,
  CategoryL2,
  Crop,
} from "@/app/onboarding/farmer/_components/crop-picker";

type ProductDetail = {
  id: string;
  name: string;
  maker_id: string | null;
  maker_name: string | null;
  type_id: string | null;
  type_name: string | null;
  general_purpose: string | null;
  primary_compound: string | null;
  mode_of_action: string | null;
  commercial_status: string | null;
  label_url: string | null;
  sds_url: string | null;
  created_at: string | null;
  images: Array<{ url: string; order: number }>;
  benefits: Array<{ id: string; category: string | null; name: string }>;
  crops: Array<{ id: string; name: string }>;
  certifications: Array<{ id: string; name: string }>;
};

type Review = {
  id: string;
  user_id: string;
  user_name: string | null;
  rating: number;
  body: string;
  created_at: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return {};

  const res = await fetch(`${apiUrl}/v1/products/${id}`, { cache: "no-store" });
  if (!res.ok) return {};

  const product = (await res.json()) as ProductDetail;
  const heroImage = product.images[0]?.url;
  const description =
    [product.maker_name, product.type_name, product.general_purpose]
      .filter(Boolean)
      .join(" / ") || `${product.name} の詳細とレビュー`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | Farmille`,
      description,
      url: `/products/${id}`,
      ...(heroImage ? { images: [heroImage] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const [productRes, reviewsRes, user, role] = await Promise.all([
    fetch(`${apiUrl}/v1/products/${id}`, { cache: "no-store" }),
    fetch(`${apiUrl}/v1/products/${id}/reviews`, { cache: "no-store" }),
    getUser(),
    getRole(),
  ]);

  if (productRes.status === 404) {
    notFound();
  }
  if (!productRes.ok) {
    throw new Error(`Failed to fetch product: ${productRes.status}`);
  }
  if (!reviewsRes.ok) {
    throw new Error(`Failed to fetch reviews: ${reviewsRes.status}`);
  }

  const product = (await productRes.json()) as ProductDetail;
  const { reviews } = (await reviewsRes.json()) as { reviews: Review[] };

  const avg = averageRating(reviews);
  const heroImage = product.images[0] ?? null;
  const subImages = product.images.slice(1, 4);

  type CropsMaster = {
    crops: Crop[];
    categories_l1: CategoryL1[];
    categories_l2: CategoryL2[];
  };
  let profileComplete = false;
  let cropsMaster: CropsMaster | null = null;
  let existingFavorite: ExistingFavorite | null = null;
  if (user && isReviewerRole(role)) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const fetches: Promise<Response>[] = [
        fetch(`${apiUrl}/v1/me/favorites?limit=200`, {
          headers,
          cache: "no-store",
        }),
      ];
      if (role === "farmer") {
        fetches.push(
          fetch(`${apiUrl}/v1/onboarding/status`, {
            headers,
            cache: "no-store",
          }),
        );
        fetches.push(
          fetch(`${apiUrl}/v1/onboarding/crops`, {
            headers,
            cache: "no-store",
          }),
        );
      }
      const results = await Promise.all(fetches);
      const favRes = results[0];
      if (favRes.ok) {
        const { favorites } = (await favRes.json()) as {
          favorites: Array<{
            id: string;
            kind: FavoriteKind;
            product: { id: string | null };
          }>;
        };
        const hit = favorites.find((f) => f.product.id === product.id);
        existingFavorite = hit ? { id: hit.id, kind: hit.kind } : null;
      }
      if (role === "farmer") {
        const statusRes = results[1];
        const cropsRes = results[2];
        if (statusRes.ok) {
          const status = (await statusRes.json()) as { has_profile?: boolean };
          profileComplete = Boolean(status.has_profile);
        }
        if (cropsRes.ok) {
          cropsMaster = (await cropsRes.json()) as CropsMaster;
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Breadcrumb bar — subtle, AgList-style */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-muted-foreground">
          <nav aria-label="パンくず" className="flex items-center gap-1.5">
            <Link
              href="/products"
              className="hover:text-[var(--green-primary)]"
            >
              資材一覧
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-12">
        {/* HERO: 2-col text + image (AgList /product/<slug> 風) */}
        <section className="grid md:grid-cols-[1fr_minmax(0,420px)] gap-8 items-start">
          <div className="space-y-5">
            {product.type_name && (
              <div className="flex flex-wrap gap-2">
                <PillBadge>{product.type_name}</PillBadge>
                {product.commercial_status && (
                  <PillBadge variant="outline">
                    {commercialStatusLabel(product.commercial_status)}
                  </PillBadge>
                )}
              </div>
            )}

            <h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground"
              style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              {product.name}
            </h1>

            <p className="text-base text-muted-foreground">
              {product.maker_name ?? "メーカー不明"}
            </p>

            {avg !== null && (
              <div className="inline-flex items-center gap-2 text-sm text-foreground">
                <Star
                  className="h-4 w-4 fill-[var(--green-primary)] text-[var(--green-primary)]"
                  aria-hidden="true"
                />
                <span className="font-semibold">{avg.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({reviews.length} 件のレビュー)
                </span>
              </div>
            )}

            {product.general_purpose && (
              <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                {product.general_purpose}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              {product.label_url && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={product.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    ラベル (PDF)
                  </a>
                </Button>
              )}
              {product.sds_url && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={product.sds_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    SDS (PDF)
                  </a>
                </Button>
              )}
              <FavoriteButton
                productId={product.id}
                mode={
                  !user
                    ? { kind: "anon" }
                    : isReviewerRole(role)
                      ? { kind: "reviewer", existing: existingFavorite }
                      : { kind: "non-reviewer", role: role ?? null }
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="relative aspect-square border border-border bg-[var(--green-subtle)] overflow-hidden"
              style={{
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {heroImage ? (
                <Image
                  src={heroImage.url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="inline-flex items-center justify-center h-16 w-16"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.6)",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    <Sprout
                      className="h-8 w-8 text-[var(--green-primary)]"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              )}
            </div>
            {subImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {subImages.map((img) => (
                  <div
                    key={img.url}
                    className="relative aspect-square border border-border bg-[var(--green-subtle)] overflow-hidden"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 33vw, 140px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* PRODUCT DETAILS — AgList の 2-col key-value, lucide icon 付き */}
        <section aria-label="資材詳細" className="space-y-5">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              資材詳細
            </h2>
          </div>
          <dl className="grid md:grid-cols-2 gap-x-10 gap-y-6">
            <DetailRow
              icon={<BookOpen className="h-4 w-4" />}
              label="一般用途"
              value={product.general_purpose}
            />
            <DetailRow
              icon={<TagIcon className="h-4 w-4" />}
              label="製品タイプ"
              value={product.type_name}
            />
            <DetailRow
              icon={<Atom className="h-4 w-4" />}
              label="主成分"
              value={product.primary_compound}
            />
            <DetailRow
              icon={<Workflow className="h-4 w-4" />}
              label="作用機序"
              value={product.mode_of_action}
            />
            <DetailRow
              icon={<BadgeCheck className="h-4 w-4" />}
              label="販売状況"
              value={
                product.commercial_status
                  ? commercialStatusLabel(product.commercial_status)
                  : null
              }
            />
            <DetailRow
              icon={<Sparkles className="h-4 w-4" />}
              label="メーカー"
              value={product.maker_name}
            />
          </dl>
        </section>

        {/* TAG GROUPS — AgList と同じく chip 群 */}
        <section aria-label="タグ" className="space-y-6">
          <TagGroup
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            label="JBSA 効果タグ (メーカー申告)"
            items={product.benefits.map((b) =>
              b.category ? `${b.category} / ${b.name}` : b.name,
            )}
            emptyText="効果タグの登録なし"
          />
          <TagGroup
            icon={<Sprout className="h-4 w-4" aria-hidden="true" />}
            label="対象作目"
            items={product.crops.map((c) => c.name)}
            emptyText="対象作目の登録なし"
          />
          <TagGroup
            icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />}
            label="認証"
            items={product.certifications.map((c) => c.name)}
            emptyText="認証の登録なし"
          />
        </section>

        {/* レビュー投稿 — 既存ロジックを継承 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-3">
            レビューを投稿
          </h2>
          {!user ? (
            <div
              className="border border-border bg-card p-6 text-center space-y-3"
              style={{
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <p className="text-foreground">
                レビューを投稿するにはログインが必要です。
              </p>
              <Button asChild>
                <Link href={`/login?next=/products/${product.id}`}>
                  ログインしてレビューを投稿する
                </Link>
              </Button>
            </div>
          ) : role === "farmer" ? (
            cropsMaster ? (
              <ReviewWithProfileGate
                productId={product.id}
                initialProfileComplete={profileComplete}
                crops={cropsMaster.crops}
                categoriesL1={cropsMaster.categories_l1}
                categoriesL2={cropsMaster.categories_l2}
              />
            ) : (
              <ReviewForm productId={product.id} />
            )
          ) : (
            <p
              className="border border-border bg-card p-6 text-center text-muted-foreground"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              このロール ({role ?? "unassigned"}) ではレビュー投稿できません。
            </p>
          )}
        </section>

        {/* レビュー一覧 */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              レビュー
            </h2>
            <span className="text-sm text-muted-foreground">
              {reviews.length} 件
            </span>
          </div>
          {reviews.length === 0 ? (
            <p
              className="border border-border bg-card p-8 text-center text-muted-foreground"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              この資材にはまだレビューがありません。
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) =>
                user && r.user_id === user.id ? (
                  <MyReviewRow
                    key={r.id}
                    productId={product.id}
                    review={{
                      id: r.id,
                      user_name: r.user_name,
                      rating: r.rating,
                      body: r.body,
                      created_at: r.created_at,
                    }}
                  />
                ) : (
                  <li
                    key={r.id}
                    className="border border-border bg-card p-5 space-y-2"
                    style={{
                      borderRadius: "var(--radius-lg)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-foreground">
                        {r.user_name ?? "匿名ユーザー"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <RatingStars rating={r.rating} />
                    <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                      {r.body}
                    </p>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[var(--green-primary)]">
              ログイン
            </Link>
            <Link href="/signup" className="hover:text-[var(--green-primary)]">
              新規登録
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function PillBadge({
  children,
  variant = "filled",
}: {
  children: React.ReactNode;
  variant?: "filled" | "outline";
}) {
  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-medium"
      style={{
        borderRadius: "var(--radius-full)",
        backgroundColor:
          variant === "filled" ? "var(--green-subtle)" : "transparent",
        color: "var(--green-dark)",
        border:
          variant === "outline"
            ? "1px solid var(--green-primary)"
            : "1px solid transparent",
      }}
    >
      {children}
    </span>
  );
}

function commercialStatusLabel(status: string): string {
  switch (status) {
    case "available":
      return "販売中";
    case "discontinued":
      return "販売終了";
    case "pre-launch":
      return "販売前";
    default:
      return status;
  }
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border pb-4 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
        <span className="text-[var(--green-primary)]">{icon}</span>
        <dt className="text-sm font-medium">{label}</dt>
      </div>
      <dd className="text-sm text-foreground flex-1 whitespace-pre-wrap leading-relaxed">
        {value ?? (
          <span className="text-muted-foreground">未登録</span>
        )}
      </dd>
    </div>
  );
}

function TagGroup({
  icon,
  label,
  items,
  emptyText,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[var(--green-primary)]">{icon}</span>
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-6">{emptyText}</p>
      ) : (
        <ul className="flex flex-wrap gap-2 pl-6">
          {items.map((item) => (
            <li
              key={item}
              className="inline-flex items-center px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: "var(--green-subtle)",
                color: "var(--green-dark)",
                borderRadius: "var(--radius-full)",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-4 w-4 fill-[var(--green-primary)] text-[var(--green-primary)]"
              : "h-4 w-4 text-muted-foreground"
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
