import Link from "next/link";

import { css, cx } from "../../styled-system/css";
import { Icon } from "@/components/Icon";
import { StarRating } from "./StarRating";

type MaterialRefCardProps = {
  href: string;
  name: string;
  manufacturerName: string;
  isOfficial?: boolean;
  avgRating?: number | null;
  /** 実証詳細レポート側の「対象資材」ラベルを出す */
  showTargetLabel?: boolean;
  className?: string;
};

/** 記事・実証詳細レポート詳細の対象資材カード（モック .card.ref）。 */
export function MaterialRefCard({
  href,
  name,
  manufacturerName,
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
          bg: "primary.100",
          textDecoration: "none",
          color: "[inherit]",
        }),
        className,
      )}
    >
      <div
        className={css({
          w: "[44px]",
          aspectRatio: "image.square",
          borderRadius: "media",
          bg: "primary.100",
          display: "grid",
          placeItems: "center",
          flexShrink: "0",
          color: "text.brandOnSoft",
        })}
      >
        <Icon name="image" size="md" />
      </div>
      <div className={css({ flex: "1", minW: "0" })}>
        {showTargetLabel ? (
          <div className={css({ fontSize: "2xs", color: "text.muted" })}>対象資材</div>
        ) : null}
        <div className={css({ textStyle: "body", fontWeight: "bold" })}>{name}</div>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1",
            flexWrap: "wrap",
            textStyle: "note",
            color: "text.muted",
            mt: "0.5",
          })}
        >
          <span>{manufacturerName}</span>
          {avgRating !== null ? <StarRating value={Math.round(avgRating)} size="sm" /> : null}
        </div>
      </div>
      <Icon
        name="chevron_right"
        size="sm"
        className={css({ color: "text.subtle", flexShrink: "0" })}
      />
    </Link>
  );
}
