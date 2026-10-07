import Link from "next/link";

import type { ContentFeedFilter } from "@/server/queries/content-feed";

import { css, cva } from "../../../../styled-system/css";
import { ArticleSearchIcon } from "./ArticleIcons";

const FILTER_OPTIONS: ReadonlyArray<{ value: ContentFeedFilter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "report", label: "実証詳細レポート" },
  { value: "article", label: "その他の記事" },
];

export function articlesHref(filter: ContentFeedFilter, q: string, page = 1): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("type", filter);
  if (q.trim().length > 0) params.set("q", q.trim());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query.length > 0 ? `/articles?${query}` : "/articles";
}

const filterPillRecipe = cva({
  base: {
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
    textDecoration: "none",
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "2px",
    },
  },
  variants: {
    active: {
      true: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "semibold",
      },
      false: {},
    },
  },
  defaultVariants: { active: false },
});

export function ArticlesSearchBar({ filter, q }: { filter: ContentFeedFilter; q: string }) {
  return (
    <>
      <form
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "2",
          bg: "surface.card",
          borderWidth: "1.5px",
          borderStyle: "solid",
          borderColor: "border.strong",
          borderRadius: "button",
          px: "3.5",
          py: "2.5",
          _focusWithin: {
            borderColor: "primary.700",
            outlineWidth: "3px",
            outlineStyle: "solid",
            outlineColor: "primary.700/16",
          },
        })}
        action="/articles"
        method="get"
        role="search"
      >
        <span className={css({ display: "flex", color: "text.subtle" })}>
          <ArticleSearchIcon />
        </span>
        {filter !== "all" ? <input type="hidden" name="type" value={filter} /> : null}
        <input
          className={css({
            flex: "1",
            minW: "0",
            borderWidth: "0",
            bg: "transparent",
            color: "text.default",
            fontSize: "md",
            outline: "none",
            _placeholder: { color: "text.subtle" },
          })}
          name="q"
          defaultValue={q}
          placeholder="記事を検索"
          aria-label="記事を検索"
        />
      </form>
      <nav
        className={css({
          display: "flex",
          gap: "1.5",
          overflowX: "auto",
          pb: "1",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        })}
        aria-label="コンテンツ種別"
      >
        {FILTER_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={articlesHref(option.value, q)}
            className={filterPillRecipe({ active: option.value === filter })}
            aria-current={option.value === filter ? "page" : undefined}
          >
            {option.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
