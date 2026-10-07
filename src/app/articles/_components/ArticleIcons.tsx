import { css, cva, cx } from "../../../../styled-system/css";

const brandStroke = css({ stroke: "primary.700" });

/** 参考になった。 */
export function ThumbIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M7 11v9H4a1 1 0 01-1-1v-7a1 1 0 011-1h3zm0 0l4-8a2 2 0 012 2v3h5a2 2 0 012 2.3l-1.2 7A2 2 0 0117.8 21H7" />
    </svg>
  );
}

/** 閲覧数。 */
export function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** 資材の印。 */
export function SeedIcon() {
  return (
    <svg
      className={brandStroke}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M7 20c0-5 2-8 5-9M17 6c0 5-2 8-5 9M5 8c3 0 5 2 5 5M19 14c-3 0-5-1-6-4" />
    </svg>
  );
}

/** 右向きの矢印。 */
export function ChevronIcon() {
  return (
    <svg
      className={css({ color: "text.subtle", flexShrink: "0" })}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** 画像が無いときの印。 */
export function ArticleImagePlaceholderIcon() {
  return (
    <svg
      className={brandStroke}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M21 16l-5-5-7 7" />
    </svg>
  );
}

/** 検索窓の虫眼鏡。 */
export function ArticleSearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

const viewCountRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    color: "text.subtle",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
    "& svg": { display: "block" },
  },
  variants: {
    size: {
      md: { fontSize: "sm", gap: "1.5" },
      sm: { fontSize: "xs", gap: "1" },
    },
  },
  defaultVariants: { size: "md" },
});

/** 閲覧数（読み上げは「N回閲覧」）。sm は2列の一覧カード用。 */
export function ViewCount({
  count,
  size,
  className,
}: {
  count: number;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <span className={cx(viewCountRecipe({ size }), className)} aria-label={`${count}回閲覧`}>
      <EyeIcon /> <span>{count.toLocaleString("ja-JP")}</span>
    </span>
  );
}
