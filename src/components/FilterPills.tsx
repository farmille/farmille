import Link from "next/link";

import { css, cx } from "../../styled-system/css";

/** ピルを横に並べ、はみ出したら横にスクロールする列。 */
export const pillRowStyle = css({
  display: "flex",
  gap: "1.5",
  overflowX: "auto",
  pb: "1",
});

/** 絞り込みのピル（fpill）。リンクは aria-current、タブは aria-selected で選択中の見た目になる。 */
export const pillStyle = css({
  flexShrink: "0",
  fontSize: "sm",
  px: "3",
  py: "1.5",
  borderRadius: "pill",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  color: "text.muted",
  cursor: "pointer",
  fontFamily: "sans",
  textDecoration: "none",
  "&:is([aria-current=page], [aria-selected=true])": {
    bg: "primary.700",
    borderColor: "primary.600",
    color: "text.inverse",
    fontWeight: "semibold",
  },
});

export type FilterPillOption = {
  href: string;
  label: string;
  current: boolean;
};

/**
 * 一覧を URL で絞り込むリンクの列。
 * 絞り込みはページ遷移なので、読み込み前でも押せるリンクにし、選択中を aria-current で示す。
 */
export function FilterPills({
  "aria-label": ariaLabel,
  items,
  className,
}: {
  "aria-label": string;
  items: readonly FilterPillOption[];
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cx(pillRowStyle, className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pillStyle}
          aria-current={item.current ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
