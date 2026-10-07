import Link from "next/link";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { NoImage } from "@/app/materials/[id]/_components/CardParts";
import { css, cva, cx } from "../../../styled-system/css";

const tabularNums = css({ fontVariantNumeric: "tabular-nums" });

export type HomeMaterialCardProps = {
  href: string;
  name: string;
  maker: string;
  /** 感想口コミが無い資材は null。 */
  rating: number | null;
  reviewCount: number;
  /** 集計が取れない資材は null（「−」で出す）。 */
  reportCount: number | null;
  savedCount: number | null;
  categories: string[];
  imageSrc?: string | null;
};

const cardStyle = css({
  flex: "none",
  display: "flex",
  flexDirection: "column",
  w: "40",
  overflow: "hidden",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  color: "inherit",
  textDecoration: "none",
  tab: { w: "72" },
});

const imageStyle = css({
  display: "grid",
  placeItems: "center",
  h: "36",
  p: "2",
  overflow: "hidden",
  bg: "surface.card",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  "& img": { display: "block", w: "full", h: "full", objectFit: "contain" },
  tab: { h: "64" },
});

const countLine = css.raw({
  mt: "1",
  color: "text.subtle",
  fontSize: "xs",
  tab: { mt: "1.5", fontSize: "sm" },
});

const countLineStyle = css(countLine);

const reportCountRecipe = cva({
  base: { fontWeight: "bold", fontVariantNumeric: "tabular-nums" },
  variants: {
    emphasized: {
      true: { color: "accent.warn", fontSize: "sm", tab: { fontSize: "md" } },
      false: {},
    },
  },
});

const tagStyle = css({
  display: "inline-block",
  py: "0.5",
  px: "2",
  bg: "surface.page",
  color: "text.muted",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "pill",
  fontSize: "2xs",
  lineHeight: "tight",
  whiteSpace: "nowrap",
  tab: { py: "1", px: "2.5", fontSize: "xs" },
});

/** ホームの掲載資材一覧のカード。 */
export function HomeMaterialCard({
  href,
  name,
  maker,
  rating,
  reviewCount,
  reportCount,
  savedCount,
  categories,
  imageSrc,
}: HomeMaterialCardProps) {
  const hasReports = reportCount !== null && reportCount > 0;
  return (
    <Link className={cardStyle} href={href} draggable={false}>
      <div className={imageStyle}>
        {imageSrc ? (
          <Image alt="" src={imageSrc} width={168} height={140} sizes="190px" draggable={false} />
        ) : (
          <NoImage />
        )}
      </div>
      <div
        className={css({
          flex: "1",
          display: "flex",
          flexDirection: "column",
          pt: "2.5",
          px: "3",
          pb: "3",
          tab: { pt: "3", px: "3.5", pb: "3.5" },
        })}
      >
        <div
          className={css({
            mb: "1",
            color: "text.muted",
            fontSize: "xs",
            truncate: true,
            tab: { mt: "1" },
          })}
        >
          {maker}
        </div>
        <div
          className={css({
            h: "2lh",
            fontSize: "sm",
            fontWeight: "bold",
            lineHeight: "snug",
            lineClamp: "2",
            tab: { fontSize: "md" },
          })}
        >
          {name}
        </div>
        <div className={css(countLine, { color: "accent.warn", fontWeight: "bold" })}>
          ★ <span className={tabularNums}>{rating === null ? "−" : rating.toFixed(1)}</span>{" "}
          <span className={css({ color: "text.subtle", fontWeight: "normal" })}>
            ({reviewCount})
          </span>
        </div>
        <div className={countLineStyle}>
          <span className={css({ whiteSpace: "nowrap" })}>
            実証詳細レポート{" "}
            <b className={reportCountRecipe({ emphasized: hasReports })}>{reportCount ?? "−"}</b>件
          </span>{" "}
          <span className={css({ whiteSpace: "nowrap" })}>
            ・ <span className={css({ color: "primary.800" })}>★</span> お気に入り{" "}
            <b className={cx(tabularNums, css({ color: "text.default", fontWeight: "bold" }))}>
              {savedCount ?? "−"}
            </b>
          </span>
        </div>
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            alignContent: "flex-start",
            rowGap: "2",
            columnGap: "1.5",
            h: "14",
            tab: { h: "16" },
            mt: "auto",
            pt: "2",
            overflow: "hidden",
          })}
        >
          {categories.map((category) => (
            <span key={category} className={tagStyle}>
              {category}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
