import Link from "next/link";

import type { ContentFeedFilter } from "@/server/queries/content-feed";

import { MockSearchIcon } from "./MockIcons";

const FILTER_OPTIONS: ReadonlyArray<{ value: ContentFeedFilter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "report", label: "実証詳細レポート" },
  { value: "article", label: "その他の記事" },
];

/** 種別とキーワードを URL の type / q に載せる（ページは1に戻す）。 */
export function articlesHref(filter: ContentFeedFilter, q: string, page = 1): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("type", filter);
  if (q.trim().length > 0) params.set("q", q.trim());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query.length > 0 ? `/articles?${query}` : "/articles";
}

/**
 * 見本 S.articles の検索窓（`.ts-box`）と種別の切り替え（`.filter-row .fpill`）。
 * 検索は GET フォーム、種別はリンクなので、読み込み中でもそのまま使える。
 */
export function ArticlesSearchBar({ filter, q }: { filter: ContentFeedFilter; q: string }) {
  return (
    <>
      <form className="ts-box" action="/articles" method="get" role="search">
        <span className="ts-ic">
          <MockSearchIcon />
        </span>
        {filter !== "all" ? <input type="hidden" name="type" value={filter} /> : null}
        <input
          className="ts-input"
          name="q"
          defaultValue={q}
          placeholder="記事を検索"
          aria-label="記事を検索"
        />
      </form>
      <nav className="filter-row" aria-label="コンテンツ種別">
        {FILTER_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={articlesHref(option.value, q)}
            className={option.value === filter ? "fpill on" : "fpill"}
            aria-current={option.value === filter ? "page" : undefined}
          >
            {option.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
