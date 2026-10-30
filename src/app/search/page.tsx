import { SiteAppBar } from "@/components/SiteAppBar";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { EmptyState } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import {
  formatLogicHint,
  parseFiltersQuery,
  parseQueryParam,
  parseSortParam,
  resolveSelectedFilters,
} from "@/components/search/search-selection";
import { filterCatalog } from "@/lib/catalog-search";
import { createPageMetadata } from "@/lib/seo";
import { matchSearchCatalog } from "@/lib/material-search";
import { getCatalogSearch, listSearchSuggestions } from "@/server/queries/catalog-search";
import { CatalogSidebar } from "./_components/CatalogSidebar";
import { listSearchFiltersByRefs } from "@/server/queries/classifications";
import { SearchBox } from "./_components/SearchBox";
import { css } from "../../../styled-system/css";
import { SearchResults } from "./_components/SearchResults";

// NEXT_PUBLIC_SITE_URL の評価をモジュール読み込み時ではなく使用時に遅延させる（layout.tsx と同じ理由）。
export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "農業資材を探す",
    description: "目的や作物、メーカーなどの条件から農業資材を検索できます。",
    path: "/search",
  });
}

const shell = css({
  minH: "dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const main = css({
  flex: "1",
  w: "full",
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  pt: "3",
  pb: "4",
  tab: { px: "5", pt: "6", pb: "8" },
});

function SearchPageShell({ children }: { children: ReactNode }) {
  return (
    <div className={shell}>
      <SiteAppBar chrome="public" active="search" title="BS資材を探す" backHref="/" />
      <main className={main}>{children}</main>
      <BottomNav active="search" />
    </div>
  );
}

function SearchPageHeading() {
  return <h1 className={css({ srOnly: true })}>BS資材を探す</h1>;
}

type SearchPageProps = {
  searchParams: Promise<{ filters?: string; sort?: string; q?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);

  let filters = [];
  let makerNames: string[] = [];
  let materialNames: string[] = [];
  let initialQuery = "";

  try {
    ({ filters, makerNames, materialNames } = parseFiltersQuery(params.filters));
    initialQuery = parseQueryParam(params.q);
  } catch {
    return (
      <SearchPageShell>
        <SearchPageHeading />
        <EmptyState
          title="検索条件が正しくありません"
          description="URL の検索パラメータを確認するか、条件を選び直してください。"
        />
      </SearchPageShell>
    );
  }

  const [filtersResult, catalogResult, catalog] = await Promise.all([
    listSearchFiltersByRefs(filters),
    listSearchSuggestions(),
    getCatalogSearch(),
  ]);

  if (!catalogResult.ok) {
    throw new Error("タグ候補の取得に失敗しました。");
  }

  if (!filtersResult.ok) {
    return (
      <SearchPageShell>
        <SearchPageHeading />
        <EmptyState
          title="指定された検索条件が見つかりません"
          description="条件を選び直して、もう一度検索してください。"
        />
      </SearchPageShell>
    );
  }

  const selected = resolveSelectedFilters({
    filters: filtersResult.data,
    makerNames,
    materialNames,
  });

  const logic = formatLogicHint(selected);

  const keywordMatches = initialQuery
    ? matchSearchCatalog(catalogResult.data, initialQuery)
    : undefined;

  const resultCount = filterCatalog(
    catalog,
    filters,
    makerNames,
    materialNames,
    keywordMatches,
  ).length;

  return (
    <SearchPageShell>
      <SearchPageHeading />
      <SearchBox
        initialQuery={initialQuery}
        selected={selected}
        sort={sort}
        catalog={catalogResult.data}
      />
      <div
        className={css({
          mt: "3.5",
          pc: {
            display: "grid",
            gridTemplateColumns: "token(sizes.96) minmax(0, 1fr)",
            gap: "5",
            alignItems: "start",
          },
        })}
      >
        <CatalogSidebar
          catalog={catalog}
          search={catalogResult.data}
          selected={selected}
          sort={sort}
          query={initialQuery}
          resultCount={resultCount}
        />
        <div className={css({ minW: "0" })}>
          <SearchResults
            catalog={catalog}
            filters={filters}
            makerNames={makerNames}
            materialNames={materialNames}
            sort={sort}
            selected={selected}
            query={initialQuery}
            keywordMatches={keywordMatches}
            logic={logic}
          />
        </div>
      </div>
    </SearchPageShell>
  );
}
