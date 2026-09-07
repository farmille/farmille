import Link from "next/link";

import { css, cx } from "../../styled-system/css";
import { ChevronIcon, ImagePlaceholderIcon, OfficialCheckIcon } from "./Icons";
import { StarRating } from "./StarRating";

type MaterialRefCardProps = {
  href: string;
  name: string;
  manufacturerName: string;
  isOfficial?: boolean;
  avgRating?: number | null;
  /** 使用レポート側の「対象資材」ラベルを出す */
  showTargetLabel?: boolean;
  className?: string;
};

/** 記事・使用レポート詳細の対象資材カード（モック .card.ref）。 */
export function MaterialRefCard({
  href,
  name,
  manufacturerName,
  isOfficial = false,
  avgRating = null,
  showTargetLabel = false,
  className,
}: MaterialRefCardProps) {
  return (
    <Link
      href={href}
      className={cx(
        css({
          display: "flex",
          alignItems: "center",
          gap: "2.5",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.default",
          borderRadius: "card",
          p: "3",
          bg: "green.soft2",
          textDecoration: "none",
          color: "inherit",
        }),
        className,
      )}
    >
      <div
        className={css({
          w: "44px",
          aspectRatio: "image.square",
          borderRadius: "button",
          bg: "green.soft2",
          display: "grid",
          placeItems: "center",
          flexShrink: "0",
          color: "brand.primary",
        })}
      >
        <ImagePlaceholderIcon size={22} />
      </div>
      <div className={css({ flex: "1", minW: "0" })}>
        {showTargetLabel ? (
          <div className={css({ fontSize: "2xs", color: "text.muted" })}>対象資材</div>
        ) : null}
        <div className={css({ fontWeight: "700", fontSize: "md", lineHeight: "1.35" })}>{name}</div>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1",
            flexWrap: "wrap",
            fontSize: "xs",
            color: "text.muted",
            mt: "0.5",
          })}
        >
          <span>
            {manufacturerName}
            {isOfficial ? "（メーカー確認済み）" : ""}
          </span>
          {isOfficial ? (
            <OfficialCheckIcon size={12} className={css({ color: "accent.official" })} />
          ) : null}
          {avgRating !== null ? <StarRating value={Math.round(avgRating)} size="sm" /> : null}
        </div>
      </div>
      <ChevronIcon className={css({ color: "text.subtle", flexShrink: "0" })} />
    </Link>
  );
}
