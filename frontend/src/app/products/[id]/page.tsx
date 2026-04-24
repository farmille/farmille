import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUser, getRole } from "@/lib/auth/server";
import { ReviewForm } from "./_components/review-form";
import { MyReviewRow } from "./_components/my-review-row";

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Farmille
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/products" className="text-foreground hover:text-primary">
              資材一覧
            </Link>
            <Link href="/login" className="text-foreground hover:text-primary">
              ログイン
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">新規登録</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-10">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/products" className="hover:text-primary">
            資材一覧
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="relative aspect-[4/3] rounded-md border border-border bg-muted overflow-hidden">
              {heroImage ? (
                <Image
                  src={heroImage.url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            {subImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {subImages.map((img) => (
                  <div
                    key={img.url}
                    className="relative aspect-square rounded-sm border border-border bg-muted overflow-hidden"
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 33vw, 16vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {product.type_name && (
              <span className="inline-block rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {product.type_name}
              </span>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {product.name}
            </h1>
            <p className="text-base text-muted-foreground">
              {product.maker_name ?? "メーカー不明"}
            </p>
            {product.commercial_status && (
              <p className="text-sm text-muted-foreground">
                販売状況: {product.commercial_status}
              </p>
            )}
            {avg !== null && (
              <p className="text-sm text-foreground">
                ★ {avg.toFixed(1)}{" "}
                <span className="text-muted-foreground">
                  ({reviews.length} 件のレビュー)
                </span>
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {product.label_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={product.label_url} target="_blank" rel="noopener noreferrer">
                    ラベル(PDF)
                  </a>
                </Button>
              )}
              {product.sds_url && (
                <Button asChild variant="outline" size="sm">
                  <a href={product.sds_url} target="_blank" rel="noopener noreferrer">
                    SDS(PDF)
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <DetailField label="一般用途" value={product.general_purpose} />
          <DetailField label="主成分" value={product.primary_compound} />
          <DetailField label="作用機序" value={product.mode_of_action} />
        </section>

        <section className="space-y-6">
          <TagGroup
            label="JBSA 効果タグ(メーカー申告)"
            items={product.benefits.map((b) =>
              b.category ? `${b.category} / ${b.name}` : b.name,
            )}
            emptyText="効果タグの登録なし"
          />
          <TagGroup
            label="対象作目"
            items={product.crops.map((c) => c.name)}
            emptyText="対象作目の登録なし"
          />
          <TagGroup
            label="認証"
            items={product.certifications.map((c) => c.name)}
            emptyText="認証の登録なし"
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            レビューを投稿
          </h2>
          {!user ? (
            <div className="rounded-md border border-border bg-card p-6 text-center space-y-3">
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
            reviews.some((r) => r.user_id === user.id) ? (
              <p className="rounded-md border border-border bg-card p-6 text-center text-muted-foreground">
                この資材には既にレビューを投稿済みです。
              </p>
            ) : (
              <ReviewForm productId={product.id} />
            )
          ) : (
            <p className="rounded-md border border-border bg-card p-6 text-center text-muted-foreground">
              このロール(
              {role ?? "unassigned"}
              )ではレビュー投稿できません。
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              レビュー
            </h2>
            <span className="text-sm text-muted-foreground">
              {reviews.length} 件
            </span>
          </div>
          {reviews.length === 0 ? (
            <p className="rounded-md border border-border bg-card p-6 text-center text-muted-foreground">
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
                    className="rounded-md border border-border bg-card p-4 space-y-2"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-foreground">
                        {r.user_name ?? "匿名ユーザー"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-foreground">
                      {"★".repeat(r.rating)}
                      <span className="text-muted-foreground">
                        {"★".repeat(5 - r.rating)}
                      </span>
                    </div>
                    <p className="text-base text-foreground whitespace-pre-wrap">
                      {r.body}
                    </p>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hover:text-primary">
              ログイン
            </Link>
            <Link href="/signup" className="hover:text-primary">
              新規登録
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base text-foreground whitespace-pre-wrap">
        {value ?? <span className="text-muted-foreground">未登録</span>}
      </p>
    </div>
  );
}

function TagGroup({
  label,
  items,
  emptyText,
}: {
  label: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="inline-block rounded-sm border border-border bg-muted px-2 py-1 text-sm text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
