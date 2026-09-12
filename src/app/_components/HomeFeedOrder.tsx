"use client";

import { useSearchParams } from "next/navigation";
import * as v from "valibot";
import Link from "next/link";
import type { HomeFeedSort } from "@/server/queries/home-order";
import { css, cva } from "../../../styled-system/css";

const pill = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    px: "3",
    py: "1",
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
  local = false,
}: {
  target: "reports" | "reviews";
  reportSort: HomeFeedSort;
  reviewSort: HomeFeedSort;
  local?: boolean;
}) {
  const params = useSearchParams();
  const selectedReportSort = v.parse(
    v.picklist(["newest", "helpful"]),
    params.get("reports") ?? reportSort,
  );
  const selectedReviewSort = v.parse(
    v.picklist(["newest", "helpful"]),
    params.get("reviews") ?? reviewSort,
  );
  const OrderLink = local ? "a" : Link;
  const current = target === "reports" ? selectedReportSort : selectedReviewSort;
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
        <OrderLink
          key={option.value}
          href={`/?reports=${target === "reports" ? option.value : selectedReportSort}&reviews=${target === "reviews" ? option.value : selectedReviewSort}#home-${target}`}
          onClick={(event) => {
            if (
              !local ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            // URLと戻る／進む履歴だけを更新し、サーバーへの再取得を起こさない。
            if (current !== option.value)
              window.history.pushState(null, "", event.currentTarget.href);
          }}
          aria-current={current === option.value ? "true" : undefined}
          className={pill({ active: current === option.value })}
        >
          {option.label}
        </OrderLink>
      ))}
    </nav>
  );
}
