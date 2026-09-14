import { Suspense } from "react";
import { SearchResultsSkeleton } from "@/components/SkeletonList";
import type { Metadata } from "next";

import { AppBar, EmptyState, MaterialCard } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import { MaterialSearchBox } from "@/components/search/MaterialSearchBox";
import { SearchSortSelect } from "@/components/search/SearchSortSelect";
import {
  formatLogicHint,
  parseFiltersQuery,
  parseQueryParam,
  parseSortParam,
  resolveSelectedFilters,
} from "@/components/search/search-selection";
import { createPageMetadata } from "@/lib/seo";
import { listMaterials } from "@/server/queries/materials";
import {
  listSearchFiltersByPairs,
  listSearchFiltersByRefs,
  listSearchSuggestions,
  POPULAR_FILTER_PAIRS,
  SEASONAL_FILTER_PAIRS,
} from "@/server/queries/classifications";
import { css } from "../../../styled-system/css";

import { SearchAnalytics } from "./_components/SearchAnalytics";

// NEXT_PUBLIC_SITE_URL の評価をモジュール読み込み時ではなく使用時に遅延させる（layout.tsx と同じ理由）。
export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "農業資材を探す",
    description: "目的や作物、メーカーなどの条件から農業資材を検索できます。",
    path: "/search",
  });
}

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const main = css({
  flex: "1",
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  pt: "3",
  pb: "4",
  tab: { px: "5", pt: "6", pb: "8" },
});

const pageTitle = css({
  position: "absolute",
  w: "1px",
  h: "1px",
  p: "0",
  m: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
  tab: {
    position: "static",
    w: "auto",
    h: "auto",
    m: "0",
    mb: "4",
    overflow: "visible",
    clip: "auto",
    whiteSpace: "normal",
    fontSize: "2xl",
    fontWeight: "800",
  },
});

const logicHint = css({
  fontSize: "xs",
  color: "text.muted",
  mt: "2.5",
  lineHeight: "1.5",
});

const logicStrong = css({
  color: "brand.primaryDeep",
  fontWeight: "700",
});

const resultHeader = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2.5",
  mt: "4.5",
  mb: "2.5",
});

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  tab: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    alignItems: "start",
  },
});

function SearchPageHeading() {
  return <h1 className={pageTitle}>BS資材を探す</h1>;
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
      <div className={shell}>
        <AppBar chrome="public" active="search" title="BS資材を探す" backHref="/" />
        <main className={main}>
          <SearchPageHeading />
          <EmptyState
            title="検索条件が正しくありません"
            description="URL の検索パラメータを確認するか、条件を選び直してください。"
          />
        </main>
        <BottomNav active="search" />
      </div>
    );
  }

  const [filtersResult, popularResult, seasonalResult, catalogResult] = await Promise.all([
    listSearchFiltersByRefs(filters),
    listSearchFiltersByPairs(POPULAR_FILTER_PAIRS),
    listSearchFiltersByPairs(SEASONAL_FILTER_PAIRS),
    listSearchSuggestions(),
  ]);

  if (!popularResult.ok || !seasonalResult.ok || !catalogResult.ok) {
    throw new Error("タグ候補の取得に失敗しました。");
  }

  if (!filtersResult.ok) {
    return (
      <div className={shell}>
        <AppBar
          chrome="public"
          active="search"
          title="BS資材を探す"
          backHref="/"
          searchQuery={initialQuery}
        />
        <main className={main}>
          <SearchPageHeading />
          <EmptyState
            title="指定された検索条件が見つかりません"
            description="条件を選び直して、もう一度検索してください。"
          />
        </main>
        <BottomNav active="search" />
      </div>
    );
  }

  const selected = resolveSelectedFilters({
    filters: filtersResult.data,
    makerNames,
    materialNames,
  });

  const logic = formatLogicHint(selected);

  return (
    <div className={shell}>
      <AppBar
        chrome="public"
        active="search"
        title="BS資材を探す"
        backHref="/"
        searchQuery={initialQuery}
      />
      <main className={main}>
        <SearchPageHeading />
        <MaterialSearchBox
          // q が変わるたびに入力欄を作り直す（同じ画面のヘッダーから再送信したときに初期値を反映するため）
          key={initialQuery}
          initialQuery={initialQuery}
          selected={selected}
          sort={sort}
          popular={popularResult.data}
          seasonal={seasonalResult.data}
          catalog={catalogResult.data}
          placeholder="作物・悩み・資材名を入力してください"
        />

        {logic.length > 0 ? (
          <p className={logicHint}>
            絞り込み条件：<span className={logicStrong}>{logic}</span>
          </p>
        ) : null}

        <Suspense
          key={JSON.stringify([filters, makerNames, materialNames, sort])}
          fallback={
            <SearchResultsSkeleton
              controls={<SearchSortSelect selected={selected} sort={sort} />}
            />
          }
        >
          <SearchResults
            filters={filters}
            makerNames={makerNames}
            materialNames={materialNames}
            sort={sort}
            selected={selected}
          />
        </Suspense>
      </main>
      <BottomNav active="search" />
    </div>
  );
}

// 検索候補は操作可能なまま、検索件数とカードをまとめて更新する。
async function SearchResults({
  filters,
  makerNames,
  materialNames,
  sort,
  selected,
}: {
  filters: NonNullable<Parameters<typeof listMaterials>[0]["filters"]>;
  makerNames: string[];
  materialNames: string[];
  sort: ReturnType<typeof parseSortParam>;
  selected: ReturnType<typeof resolveSelectedFilters>;
}) {
  const materialsResult = await listMaterials({
    filters: filters.length > 0 ? filters : undefined,
    makerNames: makerNames.length > 0 ? makerNames : undefined,
    materialNames: materialNames.length > 0 ? materialNames : undefined,
    sort,
    page: 1,
  });

  if (!materialsResult.ok) {
    throw new Error(`資材検索に失敗しました: ${materialsResult.error}`);
  }

  const { items, total } = materialsResult.data;

  return (
    <>
      <SearchAnalytics filterCount={selected.length} resultCount={total} sort={sort} />
      <div className={resultHeader}>
        <span className={css({ fontSize: "sm", color: "text.muted" })}>
          該当{" "}
          <b
            className={css({
              color: "text.default",
              fontVariantNumeric: "tabular-nums",
              fontWeight: "700",
            })}
          >
            {total}
          </b>{" "}
          件
        </span>
        <SearchSortSelect selected={selected} sort={sort} />
      </div>

      {items.length > 0 ? (
        <div className={stack}>
          {items.map((material, index) => (
            <MaterialCard
              key={material.id}
              variant="list"
              name={material.name}
              maker={material.manufacturer_name}
              rating={material.avg_rating ?? 0}
              reviewCount={material.review_count}
              official={material.manufacturer_verified_at !== null}
              imageSrc={material.primaryImage?.url}
              description={material.description ?? undefined}
              href={`/materials/${material.id}`}
              preload={index === 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="条件に合う資材が見つかりませんでした"
          description="分類の組み合わせを変えるか、条件を減らして再度お試しください。"
        />
      )}
    </>
  );
}
