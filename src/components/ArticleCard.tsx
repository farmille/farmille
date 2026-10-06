import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { Badge } from "./Badge";
import { helpfulPillRecipe } from "./helpful-pill";
import { surfaceCardRecipe } from "./SurfaceCard";
import { Icon } from "@/components/Icon";

const cardRecipe = cva({
  base: {
    overflow: "hidden",
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
});

const cover = css({
  aspectRatio: "image.wide",
  bg: "primary.100",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  color: "primary.700",
});

export type ArticleCardProps = {
  title: string;
  organization: string;
  typeLabel: string;
  helpfulCount: number;
  viewCount?: number;
  href?: string;
  coverSrc?: string;
  official?: boolean;
  className?: string;
};

/** 組織記事カード（orgArticleCard）。 */
export function ArticleCard({
  title,
  organization,
  typeLabel,
  helpfulCount,
  viewCount,
  href = "#",
  coverSrc,
  className,
}: ArticleCardProps) {
  const initial = organization.charAt(0);

  return (
    <Link
      href={href}
      className={cx(surfaceCardRecipe({ padding: "flush" }), cardRecipe(), className)}
    >
      <div className={cover} data-ui="article-card-image">
        {coverSrc ? (
          <Image
            alt=""
            className={css({
              display: "block",
              w: "100%",
              h: "100%",
              objectFit: "cover",
            })}
            height={360}
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
            src={coverSrc}
            width={640}
          />
        ) : (
          <Icon name="image" size="lg" />
        )}
      </div>
      <div className={css({ px: "3.5", py: "3" })}>
        <div className={css({ fontSize: "md", fontWeight: "bold", lineHeight: "snug" })}>
          {title}
        </div>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1.5",
            fontSize: "xs",
            color: "text.muted",
            mt: "2",
            flexWrap: "wrap",
          })}
        >
          <span
            className={css({
              w: "18px",
              h: "18px",
              borderRadius: "mark",
              bg: "primary.200",
              display: "grid",
              placeItems: "center",
              fontSize: "2xs",
              fontWeight: "extrabold",
              color: "primary.700",
              flexShrink: "0",
            })}
          >
            {initial}
          </span>
          {organization}

          <Badge variant="type">{typeLabel}</Badge>
        </div>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2",
            flexWrap: "wrap",
            fontSize: "xs",
            color: "text.subtle",
            mt: "2",
          })}
        >
          <span className={cx(helpfulPillRecipe(), css({ whiteSpace: "nowrap" }))}>
            <Icon name="thumb_up" size="xs" />
            <span>参考になった</span>
            {helpfulCount}
          </span>
          {viewCount !== undefined ? (
            <span
              className={css({
                flexShrink: "0",
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              })}
            >
              {viewCount} 回閲覧
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
