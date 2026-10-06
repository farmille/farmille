import type { Metadata } from "next";

import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込み、同じ詳細度のルールを上書きする。
import "@/app/_mock/home-search.css";
import { EmptyState } from "@/components";
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
import { MockSearchBox } from "./_components/MockSearchBox";
import { MockSortSelect } from "./_components/MockSortSelect";
import { SearchResultCard } from "./_components/SearchResultCard";

import { SearchAnalytics } from "./_components/SearchAnalytics";

// NEXT_PUBLIC_SITE_URL の評価をモジュール読み込み時ではなく使用時に遅延させる（layout.tsx と同じ理由）。
export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "農業資材を探す",
    description: "目的や作物、メーカーなどの条件から農業資材を検索できます。",
    path: "/search",
  });
}

/** 見本は戻るバーの題名だけで本文に見出しを置かないので、見出しは読み上げ用に残す。 */
function SearchPageHeading() {
  return <h1 className="sr-only">BS資材を探す</h1>;
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
      <MockPageShell active="search" title="BS資材を探す" backHref="/">
        <SearchPageHeading />
        <EmptyState
          title="検索条件が正しくありません"
          description="URL の検索パラメータを確認するか、条件を選び直してください。"
        />
      </MockPageShell>
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
      <MockPageShell active="search" title="BS資材を探す" backHref="/" searchQuery={initialQuery}>
        <SearchPageHeading />
        <EmptyState
          title="指定された検索条件が見つかりません"
          description="条件を選び直して、もう一度検索してください。"
        />
      </MockPageShell>
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

  // 見本 S.search の `.body`。スタイルは mock.css（.fm 配下）と home-search.css。
  return (
    <MockPageShell active="search" title="BS資材を探す" backHref="/" searchQuery={initialQuery}>
      <SearchPageHeading />
      <MockSearchBox
        initialQuery={initialQuery}
        selected={selected}
        sort={sort}
        catalog={catalogResult.data}
      />
      <div className="s-cols">
        <CatalogSidebar
          catalog={catalog}
          search={catalogResult.data}
          selected={selected}
          sort={sort}
          query={initialQuery}
        />
        <div className="s-main" style={{ minWidth: 0 }}>
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
    </MockPageShell>
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
  logic,
}: {
  catalog: CatalogSearch;
  filters: SearchFilterRef[];
  makerNames: string[];
  materialNames: string[];
  sort: ReturnType<typeof parseSortParam>;
  selected: ReturnType<typeof resolveSelectedFilters>;
  query: string;
  keywordMatches: ReturnType<typeof matchSearchCatalog> | undefined;
  logic: string;
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
      <div className="logic-hint">
        {logic.length > 0 ? (
          <>
            絞り込み条件：<b>{logic}</b>
          </>
        ) : (
          `全 ${catalog.materials.length} 件を表示中（条件を追加すると絞り込みます）`
        )}
      </div>
      <div className="sec-h" style={{ marginTop: 8 }}>
        <span className="muted" style={{ fontSize: 12.5 }} role="status">
          該当{" "}
          <b className="tnum" style={{ color: "var(--ink)" }}>
            {items.length}
          </b>{" "}
          件
        </span>
        <MockSortSelect selected={selected} sort={sort} query={query} />
      </div>
      {items.length === 0 ? (
        <div
          className="card pad"
          style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}
        >
          <p style={{ fontWeight: 700, color: "var(--ink-2)" }}>
            条件に合う資材が見つかりませんでした
          </p>
          <p style={{ marginTop: 4 }}>
            分類の組み合わせを変えるか、条件を減らして再度お試しください。
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.title ?? "results"}>
            {group.title ? (
              <h2 className="search-group-h">
                {group.title} {group.items.length}件
              </h2>
            ) : null}
            <div className="stack search-results">
              {group.items.map(({ material, evidence }, index) => {
                const counts = catalog.counts.find((row) => row.material_id === material.id);
                if (!counts) throw new Error("資材の集計が見つかりませんでした。");
                return (
                  <SearchResultCard
                    key={material.id}
                    href={`/materials/${material.id}`}
                    name={material.name}
                    maker={material.manufacturer_name}
                    rating={material.review_count > 0 ? material.avg_rating : null}
                    reviewCount={material.review_count}
                    reportCount={counts.report_count}
                    savedCount={counts.saved_count}
                    description={material.description}
                    categories={material.material_ingredient_categories.map(
                      (row) => row.ingredient_categories.name,
                    )}
                    directEvidence={evidence.direct}
                    groupEvidence={evidence.groups}
                    imageSrc={
                      material.material_images
                        .filter((image) => image.is_current)
                        .toSorted((a, b) => a.sort_order - b.sort_order)[0]?.url
                    }
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
