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
import { matchSearchCatalog } from "@/lib/material-search";
import {
  getCatalogSearch,
  listSearchSuggestions,
  type CatalogSearch,
} from "@/server/queries/catalog-search";
import { filterCatalog, cropEvidence } from "@/lib/catalog-search";
import { CatalogSidebar } from "./_components/CatalogSidebar";
import type { SearchFilterRef } from "@/lib/material-search";
import { listSearchFiltersByRefs } from "@/server/queries/classifications";
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
  },
});

const logicHint = css({
  fontSize: "xs",
  color: "text.muted",
  mt: "2.5",
  lineHeight: "normal",
});

const logicStrong = css({
  color: "primary.700",
  fontWeight: "bold",
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
  const keywordMatches = initialQuery
    ? matchSearchCatalog(catalogResult.data, initialQuery)
    : undefined;

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
        <div
          className={css({
            display: "grid",
            gap: "4",
            tab: { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 3fr)" },
          })}
        >
          <CatalogSidebar
            catalog={catalog}
            search={catalogResult.data}
            selected={selected}
            sort={sort}
            query={initialQuery}
          />
          <div className={css({ minW: "0" })}>
            <MaterialSearchBox
              initialQuery={initialQuery}
              selected={selected}
              sort={sort}
              popular={[]}
              seasonal={[]}
              catalog={catalogResult.data}
              placeholder="作物・悩み・資材名を入力してください"
            />

            {logic.length > 0 ? (
              <p className={logicHint}>
                絞り込み条件：<span className={logicStrong}>{logic}</span>
              </p>
            ) : null}

            <SearchResults
              catalog={catalog}
              filters={filters}
              makerNames={makerNames}
              materialNames={materialNames}
              sort={sort}
              selected={selected}
              query={initialQuery}
              keywordMatches={keywordMatches}
            />
          </div>
        </div>
      </main>
      <BottomNav active="search" />
    </div>
  );
}

// 作目への直接記載を先に並べ、同じ資材を下の分類グループへ重複表示しない。
function SearchResults({
  catalog,
  filters,
  makerNames,
  materialNames,
  sort,
  selected,
  query,
  keywordMatches,
}: {
  catalog: CatalogSearch;
  filters: SearchFilterRef[];
  makerNames: string[];
  materialNames: string[];
  sort: ReturnType<typeof parseSortParam>;
  selected: ReturnType<typeof resolveSelectedFilters>;
  query: string;
  keywordMatches: ReturnType<typeof matchSearchCatalog> | undefined;
}) {
  const items = filterCatalog(catalog, filters, makerNames, materialNames, keywordMatches).toSorted(
    (a, b) => {
      if (sort === "rating")
        return (b.avg_rating ?? 0) - (a.avg_rating ?? 0) || a.name.localeCompare(b.name, "ja");
      if (sort === "newest")
        return b.created_at.localeCompare(a.created_at) || a.name.localeCompare(b.name, "ja");
      return b.review_count - a.review_count || a.name.localeCompare(b.name, "ja");
    },
  );
  const cropFilters = [...filters, ...(keywordMatches?.filters ?? [])].filter(
    (filter) => filter.category === "crop",
  );
  const namedCrops = catalog.crops.filter((crop) =>
    cropFilters.some((filter) => filter.id === crop.id),
  );
  const results = items.map((material) => ({
    material,
    evidence: cropEvidence(material, cropFilters, catalog),
  }));
  const direct = results.filter(
    (result) => result.evidence.direct.length > 0 || result.evidence.groups.length === 0,
  );
  const broader = results.filter(
    (result) => result.evidence.direct.length === 0 && result.evidence.groups.length > 0,
  );
  const groups =
    namedCrops.length > 0
      ? [
          {
            title: `「${namedCrops.map((crop) => crop.name).join("・")}」の記載がある資材`,
            items: direct,
          },
          { title: "作物分類として記載のある資材", items: broader },
        ]
      : [{ title: null, items: results }];
  return (
    <>
      <SearchAnalytics filterCount={selected.length} resultCount={items.length} sort={sort} />
      <div className={resultHeader}>
        <span role="status">
          該当 <b>{items.length}</b> 件
        </span>
        <SearchSortSelect selected={selected} sort={sort} query={query} />
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="条件に合う資材が見つかりませんでした"
          description="分類の組み合わせを変えるか、条件を減らして再度お試しください。"
        />
      ) : (
        groups.map((group) => (
          <section key={group.title ?? "results"}>
            {group.title ? (
              <h2 className={css({ fontSize: "md", mt: "4" })}>
                {group.title} {group.items.length}件
              </h2>
            ) : null}
            <div className={stack}>
              {group.items.map(({ material, evidence }, index) => {
                const counts = catalog.counts.find((row) => row.material_id === material.id);
                if (!counts) throw new Error("資材の集計が見つかりませんでした。");
                return (
                  <MaterialCard
                    key={material.id}
                    variant="list"
                    name={material.name}
                    maker={material.manufacturer_name}
                    rating={material.avg_rating ?? 0}
                    reviewCount={material.review_count}
                    articleCount={counts.report_count}
                    savedCount={counts.saved_count}
                    categories={material.material_ingredient_categories.map(
                      (row) => row.ingredient_categories.name,
                    )}
                    evidenceBadges={[
                      ...evidence.direct.map((name) => `✓ ${name}の記載あり`),
                      ...(!evidence.direct.length
                        ? evidence.groups.map((name) => `${name}として記載`)
                        : []),
                    ]}
                    imageSrc={
                      material.material_images
                        .filter((image) => image.is_current)
                        .toSorted((a, b) => a.sort_order - b.sort_order)[0]?.url
                    }
                    description={material.description ?? undefined}
                    href={`/materials/${material.id}`}
                    preload={index === 0}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
}
