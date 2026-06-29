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
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, getRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./_components/review-form";
import { ReviewWithProfileGate } from "./_components/review-with-profile-gate";
import { MyReviewRow } from "./_components/my-review-row";
import { ReviewImageGrid } from "./_components/review-image-grid";
import {
  FavoriteButton,
  type ExistingFavorite,
  type FavoriteKind,
} from "./_components/favorite-button";
import { isReviewerRole } from "@/lib/auth/roles";
import {
  PRODUCT_IMAGES_ENABLED,
  REVIEW_VIA_GOOGLE_FORM,
  REVIEW_IMAGES_ENABLED,
} from "@/lib/flags";
import { GoogleFormReviewEmbed } from "@/components/google-form-review-embed";
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
  is_public?: boolean | null;
  type_id: string | null;
  type_name: string | null;
  general_purpose: string | null;
  primary_compound: string | null;
  mode_of_action: string | null;
  commercial_status: string | null;
  label_url: string | null;
  sds_url: string | null;
  created_at: string | null;
  images: Array<{
    url: string;
    order: number;
    source_page_url: string | null;
  }>;
  sources: Array<{
    source_type: string | null;
    title: string | null;
    url: string;
    rank: string | null;
  }>;
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
  images?: string[];
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

// ─── 出典・公式情報ボタン（2026-06-07 根本さん指示） ───
// Farmille は公式情報の転載サイトではなく「公開情報を整理し、公式情報への
// 導線を提供する」サイトとして見せる。公式製品ページがあればメインボタン、
// カタログPDF / オンラインショップ / SDS はサブボタン。全て別タブで開き、
// iframe 埋め込み・PDF の自社配信はしない。
type OfficialLink = { label: string; url: string; main: boolean };

function buildOfficialLinks(product: ProductDetail): OfficialLink[] {
  const sources = product.sources ?? [];
  // backend が rank S>A>B>C / 公式製品ページ優先でソート済みのため先頭一致で最良を取る
  const first = (types: string[]): string | null =>
    sources.find((s) => s.source_type && types.includes(s.source_type))?.url ??
    null;

  const links: OfficialLink[] = [];
  const officialPage = first(["公式製品ページ"]);
  if (officialPage) {
    links.push({ label: "製造元公式ページを見る", url: officialPage, main: true });
  }
  const catalog = first(["公式カタログ", "公式PDF"]) ?? product.label_url;
  if (catalog) {
    links.push({ label: "公式カタログPDFを見る", url: catalog, main: false });
  }
  const shop = first(["公式販売ページ"]);
  if (shop) {
    links.push({ label: "公式オンラインショップを見る", url: shop, main: false });
  }
  const sds = first(["公式SDS", "公式技術資料"]) ?? product.sds_url;
  if (sds) {
    links.push({ label: "SDS・技術資料を見る", url: sds, main: false });
  }
  return links;
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

// UUID v4 形式チェック (FastAPI 側で 422 になる前にここで弾く)。
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 2026-05-27 hotfix: `/products/admin` のような non-UUID パスは即 404。
  // FastAPI の 422 が page-level Error で落ちて投資家デモが死ぬ事故防止。
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  // ログイン中ならトークンを付けて取得 → 自社の未公開(承認待ち)資材は owner/admin に限り
  // backend が返す (2026-06-15)。匿名は従来どおり公開済みのみ。
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const productHeaders = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined;

  const [productRes, reviewsRes, user, role] = await Promise.all([
    fetch(`${apiUrl}/v1/products/${id}`, {
      cache: "no-store",
      headers: productHeaders,
    }),
    fetch(`${apiUrl}/v1/products/${id}/reviews`, { cache: "no-store" }),
    getUser(),
    getRole(),
  ]);

  // 404 / 422 (id 不正) は同じ「見つからない」UX で揃える。
  if (productRes.status === 404 || productRes.status === 422) {
    notFound();
  }
  if (!productRes.ok) {
    throw new Error(`Failed to fetch product: ${productRes.status}`);
  }
  if (!reviewsRes.ok && reviewsRes.status !== 422) {
    throw new Error(`Failed to fetch reviews: ${reviewsRes.status}`);
  }

  const product = (await productRes.json()) as ProductDetail;
  const { reviews } = (await reviewsRes.json()) as { reviews: Review[] };

  const avg = averageRating(reviews);
  const heroImage = product.images[0] ?? null;
  const subImages = product.images.slice(1, 4);

  // 出典リンク: 画像があれば画像自身の出典ページを優先、無ければ
  // product_sources の代表 (backend が rank S > A > B > C / 公式製品ページ優先で
  // ソート済みの先頭)。ホットリンク画像の著作権上の出典明示 + 該当 BS 資材かの
  // 最終確認導線 (2026-06-06 Ryoga 確定)。
  const sourceUrl =
    heroImage?.source_page_url ?? product.sources?.[0]?.url ?? null;
  const officialLinks = buildOfficialLinks(product);

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
        {/* 未公開(承認待ち)の自社資材を owner/admin が見ている時の注意バナー (2026-06-15)。
            匿名/他者はそもそも 404 なのでここに到達しない。 */}
        {product.is_public === false && (
          <div
            role="status"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800"
          >
            このページは<strong>未公開（承認待ち）</strong>です。運営の承認後に一般公開されます。現在は出品メーカーと運営のみが閲覧できます。
          </div>
        )}
        {/* HERO: 商品名 → 製造元名 → カテゴリ → 公式情報ボタン → 画像エリア
            (2026-06-07 根本さん指示の表示順。概要は下の資材詳細セクションで表示) */}
        <section className="grid md:grid-cols-[1fr_minmax(0,420px)] gap-8 items-start">
          <div className="space-y-5">
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
              style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              {product.name}
            </h1>

            <p className="text-base text-muted-foreground">
              {product.maker_name ?? "製造元不明"}
            </p>

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

            {/* 出典・公式情報: 公式ページはメインボタン、他はサブボタン。全て別タブ */}
            {officialLinks.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3">
                  {officialLinks.map((link) => (
                    <Button
                      key={link.label}
                      asChild
                      variant={link.main ? "default" : "outline"}
                      size={link.main ? "default" : "sm"}
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        {link.main ? (
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        )}
                        {link.label}
                      </a>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  製品の最新情報・正式な使用方法は、必ず製造元公式情報をご確認ください。
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
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
              {PRODUCT_IMAGES_ENABLED && heroImage ? (
                <Image
                  src={heroImage.url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span
                    className="inline-flex items-center justify-center h-16 w-16"
                    style={{
                      backgroundColor: "var(--overlay-on-light-soft)",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    <Sprout
                      className="h-8 w-8 text-[var(--green-primary)]"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    画像準備中
                  </span>
                </div>
              )}
            </div>
            {sourceUrl && (
              <p className="text-xs text-muted-foreground text-center">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[var(--green-primary)] underline-offset-4 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  製品画像は製造元公式サイトでご確認ください
                </a>
              </p>
            )}
            {PRODUCT_IMAGES_ENABLED && subImages.length > 0 && (
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
              label="製造元（※一部、販売元を含みます）"
              value={product.maker_name}
            />
          </dl>
        </section>

        {/* TAG GROUPS — AgList と同じく chip 群 */}
        <section aria-label="タグ" className="space-y-6">
          <TagGroup
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            label="効果分類（JBSA基準・製造元申告）"
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

        {/* 共通注記（全商品共通・2026-06-07 根本さん指示） */}
        <section aria-label="掲載情報について">
          <p
            className="border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            掲載されている製品情報は、製造元公式サイト等の公開情報をもとに
            Farmille が独自に整理・分類したものです。Farmille
            は各製造元の公式サイトではありません。なお「製造元」は製品の製造元を
            示しますが、製品によっては販売元・輸入元を記載している場合があります。
            効果分類・販売状況・対象作物・
            使用方法を含む製品の最新情報、正式な使用方法、適用条件については、
            必ず製造元公式情報をご確認ください。
          </p>
        </section>

        {/* レビュー投稿: 2026-06-10 根本さん指示で Google フォームに一本化（ログイン不要で
            誰でも投稿可）。現行のサイト内フォーム（ログイン+farmer権限+プロフィール必須）は
            REVIEW_VIA_GOOGLE_FORM を false に戻せば即復活する（下の節に温存）。
            レビュー一覧は従来どおり下に表示。 */}
        {REVIEW_VIA_GOOGLE_FORM && <GoogleFormReviewEmbed />}

        {!REVIEW_VIA_GOOGLE_FORM && (
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
          ) : role === "admin" ? (
            // 2026-06-07: admin は運営としてレビュー投稿可 (プロフィールゲートなし)
            <ReviewForm productId={product.id} />
          ) : (
            <p
              className="border border-border bg-card p-6 text-center text-muted-foreground"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              このロール ({role ?? "unassigned"}) ではレビュー投稿できません。
            </p>
          )}
        </section>
        )}

        {/* レビュー一覧 */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              レビュー
            </h2>
            <span className="text-sm text-muted-foreground">
              {reviews.length === 0 ? "レビュー募集中" : `${reviews.length} 件`}
            </span>
          </div>
          {/* レビュー免責（2026-06-07 奥田さん指示）: 感想ベースであることを明示 */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            レビューは個々の生産者の使用環境における感想であり、効果を保証する
            ものではありません。使用にあたっては必ず製造元公式情報をご確認ください。
          </p>
          {reviews.length === 0 ? (
            <div
              className="border border-border bg-card p-8 text-center space-y-2"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <p className="font-semibold text-foreground">レビュー募集中</p>
              <p className="text-sm text-muted-foreground">
                この製品の使用経験がある方は、作物・使用時期・感じた変化を
                ぜひ共有してください。
              </p>
            </div>
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
                      images: REVIEW_IMAGES_ENABLED ? r.images : undefined,
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
                    {REVIEW_IMAGES_ENABLED && (
                      <ReviewImageGrid images={r.images} />
                    )}
                    {user && r.user_id !== user.id ? (
                      <div className="pt-1 text-right">
                        <Link
                          href={`/report/user/${encodeURIComponent(r.user_id)}?from=/products/${encodeURIComponent(product.id)}`}
                          className="text-xs text-muted-foreground hover:text-destructive underline-offset-4 hover:underline"
                          aria-label={`このレビューを投稿した ${r.user_name ?? "ユーザー"} を通報`}
                        >
                          このユーザーを通報
                        </Link>
                      </div>
                    ) : null}
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </main>
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
