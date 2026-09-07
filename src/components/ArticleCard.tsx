import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { Badge } from "./Badge";
import { ImagePlaceholderIcon, OfficialCheckIcon, ThumbIcon } from "./Icons";

const cardRecipe = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    overflow: "hidden",
    bg: "surface.card",
    boxShadow: "shadow",
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
});

const cover = css({
  aspectRatio: "image.wide",
  bg: "green.soft2",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  color: "brand.primary",
});

const helpfulBtn = css({
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
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
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
  official = true,
  className,
}: ArticleCardProps) {
  const initial = organization.charAt(0);

  return (
    <Link href={href} className={cx(cardRecipe(), className)}>
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
          <ImagePlaceholderIcon />
        )}
      </div>
      <div className={css({ px: "3.5", py: "3" })}>
        <div className={css({ fontSize: "md", fontWeight: "700", lineHeight: "1.4" })}>{title}</div>
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
              borderRadius: "1.5",
              bg: "brand.soft",
              display: "grid",
              placeItems: "center",
              fontSize: "2xs",
              fontWeight: "800",
              color: "brand.primaryDeep",
              flexShrink: "0",
            })}
          >
            {initial}
          </span>
          {organization}
          {official ? (
            <OfficialCheckIcon size={12} className={css({ color: "accent.official" })} />
          ) : null}
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
          <span className={helpfulBtn}>
            <ThumbIcon />
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
