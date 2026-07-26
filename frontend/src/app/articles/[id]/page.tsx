import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { notFound } from "next/navigation";

import { AppBar, Badge, MaterialRefCard } from "@/components";
import { OfficialCheckIcon, ThumbIcon } from "@/components/icons";
import { formatDateJa } from "@/components/format-date";
import { sellerTypeLabel } from "@/components/seller-type-label";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { getSessionUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { getPublishedArticle } from "@/server/queries/articles";
import { recordViewEvent } from "@/server/queries/view-events";
import { css } from "../../../../styled-system/css";

type ArticleDetailPageProps = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const shell = css({
  minH: "100dvh",
  maxW: "md",
  mx: "auto",
  bg: "surface.panel",
  pb: "6",
});

const main = css({
  px: "3.5",
  py: "4",
});

async function loadArticle(id: string) {
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const result = await getPublishedArticle(id);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  if (result.data === null) {
    notFound();
  }

  return result.data;
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await loadArticle(id);

  return {
    title: `${article.title} | Farmille`,
    description: `${article.seller.official_name ?? "出品者"}による記事「${article.title}」`,
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params;
  const article = await loadArticle(id);
  const session = await getSessionUser();
  const bodyHtml = await renderMarkdownToHtml(article.body);

  // 閲覧記録は表示をブロックしない（失敗しても画面は出す）。
  after(async () => {
    await recordViewEvent({
      targetType: "article",
      targetId: article.id,
      viewerUserId: session?.accountType === "general" ? session.userId : null,
    });
  });

  const sellerName = article.seller.official_name ?? "出品者";
  const sellerInitial = sellerName.charAt(0);

  return (
    <div className={shell}>
      <AppBar title="" backHref="/articles" shareHref={`/articles/${article.id}`} />
      <main className={main}>
        <h1
          className={css({
            m: "0",
            fontSize: "xl",
            fontWeight: "700",
            lineHeight: "1.4",
          })}
        >
          {article.title}
        </h1>

        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            mt: "3",
            fontSize: "sm",
            color: "text.muted",
            flexWrap: "wrap",
          })}
        >
          <Link
            href={`/sellers/${article.seller.id}`}
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "2",
              textDecoration: "none",
              color: "inherit",
            })}
          >
            {article.seller.logo_url ? (
              <img
                src={article.seller.logo_url}
                alt=""
                className={css({
                  w: "32px",
                  h: "32px",
                  borderRadius: "button",
                  objectFit: "cover",
                })}
              />
            ) : (
              <span
                className={css({
                  w: "32px",
                  h: "32px",
                  borderRadius: "button",
                  bg: "brand.soft",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "sm",
                  fontWeight: "800",
                  color: "brand.primaryDeep",
                })}
              >
                {sellerInitial}
              </span>
            )}
            <span className={css({ fontWeight: "700", color: "text.default" })}>{sellerName}</span>
            <OfficialCheckIcon size={14} className={css({ color: "accent.official" })} />
          </Link>
          <Badge variant="type">{sellerTypeLabel(article.seller.seller_type ?? "other")}</Badge>
          <span className={css({ fontSize: "xs" })}>{formatDateJa(article.publishedAt)}</span>
        </div>

        {article.heroImageUrl ? (
          <div
            className={css({
              mt: "4",
              borderRadius: "card",
              overflow: "hidden",
              bg: "green.soft2",
            })}
          >
            <img
              src={article.heroImageUrl}
              alt=""
              className={css({
                w: "100%",
                display: "block",
                aspectRatio: "16/9",
                objectFit: "cover",
              })}
            />
          </div>
        ) : null}

        <div
          className={css({
            mt: "4",
            fontSize: "md",
            color: "text.muted",
            lineHeight: "1.75",
            "& p": { mb: "3.5" },
            "& p:last-child": { mb: "0" },
            "& img": { maxW: "100%", borderRadius: "button" },
            "& ul, & ol": { pl: "5", mb: "3.5" },
            "& h2, & h3": {
              color: "text.default",
              fontWeight: "700",
              mt: "5",
              mb: "2",
            },
          })}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />

        {article.materials.length > 0 ? (
          <section aria-labelledby="article-materials-heading">
            <h2
              id="article-materials-heading"
              className={css({
                m: "0",
                mt: "6",
                mb: "3",
                fontSize: "md",
                fontWeight: "700",
              })}
            >
              この記事で紹介した資材
            </h2>
            <div className={css({ display: "flex", flexDirection: "column", gap: "2.5" })}>
              {article.materials.map((material) => (
                <MaterialRefCard
                  key={material.id}
                  href={`/materials/${material.id}`}
                  name={material.name}
                  manufacturerName={material.manufacturer_name}
                  isOfficial={material.seller_id !== null}
                  avgRating={material.avg_rating}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: "4",
            fontSize: "xs",
            color: "text.subtle",
          })}
        >
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "1.5",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "border.strong",
              bg: "surface.card",
              color: "text.muted",
              borderRadius: "pill",
              px: "3",
              py: "1.5",
              fontSize: "sm",
              fontVariantNumeric: "tabular-nums",
            })}
          >
            <ThumbIcon />
            <span>参考になった</span>
            {article.helpfulCount}
          </span>
          <span className={css({ fontVariantNumeric: "tabular-nums" })}>
            {article.viewCount} 回閲覧
          </span>
        </div>
      </main>
    </div>
  );
}
