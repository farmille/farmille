import Link from "next/link";
import type { HomeFeedSort } from "@/server/queries/home-order";
import { css, cva } from "../../../styled-system/css";

const pill = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    px: "3",
    py: "2",
    borderRadius: "pill",
    fontSize: "xs",
    textDecoration: "none",
    borderWidth: "1px",
    borderColor: "border.default",
  },
  variants: {
    active: {
      true: { bg: "brand.primary", color: "surface.card" },
      false: { bg: "surface.card", color: "text.muted" },
    },
  },
});

export function HomeFeedOrder({
  target,
  reportSort,
  reviewSort,
}: {
  target: "reports" | "reviews";
  reportSort: HomeFeedSort;
  reviewSort: HomeFeedSort;
}) {
  const current = target === "reports" ? reportSort : reviewSort;
  const options: { value: HomeFeedSort; label: string }[] =
    target === "reports"
      ? [
          { value: "newest", label: "新着順" },
          { value: "helpful", label: "参考になった順" },
        ]
      : [
          { value: "helpful", label: "直近1週間で参考になったが多い順" },
          { value: "newest", label: "新着順" },
        ];
  return (
    <nav
      aria-label={target === "reports" ? "使用レポートの表示順" : "レビューの表示順"}
      className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}
    >
      {options.map((option) => (
        <Link
          key={option.value}
          href={`/?reports=${target === "reports" ? option.value : reportSort}&reviews=${target === "reviews" ? option.value : reviewSort}#home-${target}`}
          aria-current={current === option.value ? "true" : undefined}
          className={pill({ active: current === option.value })}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
