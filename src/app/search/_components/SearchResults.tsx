import { cropEvidence, filterCatalog } from "@/lib/catalog-search";
import type { SearchFilterRef, matchSearchCatalog } from "@/lib/material-search";
import type { MaterialSortParam, SelectedSearchFilter } from "@/components/search/search-selection";
import type { CatalogSearch } from "@/server/queries/catalog-search";

import { MaterialCard } from "@/components/MaterialCard";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { css } from "../../../../styled-system/css";

import { SortSelect } from "./SortSelect";
import { SearchAnalytics } from "./SearchAnalytics";

export function SearchResults({
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
  sort: MaterialSortParam;
  selected: SelectedSearchFilter[];
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
      <div className={css({ mt: "2.5", color: "text.muted", textStyle: "note" })}>
        {logic.length > 0 ? (
          <>
            絞り込み条件：<b className={css({ color: "text.brand" })}>{logic}</b>
          </>
        ) : (
          `全 ${catalog.materials.length} 件を表示中（条件を追加すると絞り込みます）`
        )}
      </div>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2.5",
          mt: "2",
          mb: "2.5",
          tab: { mb: "5" },
        })}
      >
        <span className={css({ color: "text.subtle", fontSize: "sm" })} role="status">
          該当{" "}
          <b className={css({ color: "text.default", fontVariantNumeric: "tabular-nums" })}>
            {items.length}
          </b>{" "}
          件
        </span>
        <SortSelect selected={selected} sort={sort} query={query} />
      </div>
      {items.length === 0 ? (
        <div
          className={css(surfaceCardRecipe.raw(), {
            color: "text.subtle",
            textStyle: "supporting",
            textAlign: "center",
          })}
        >
          <p className={css({ color: "text.muted", fontWeight: "bold" })}>
            条件に合う資材が見つかりませんでした
          </p>
          <p className={css({ mt: "1" })}>
            分類の組み合わせを変えるか、条件を減らして再度お試しください。
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.title ?? "results"}>
            {group.title ? (
              <h2 className={css({ mt: "4", mb: "2", textStyle: "title", fontWeight: "bold" })}>
                {group.title} {group.items.length}件
              </h2>
            ) : null}
            <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
              {group.items.map(({ material, evidence }, index) => {
                const counts = catalog.counts.find((row) => row.material_id === material.id);
                if (!counts) throw new Error("資材の集計が見つかりませんでした。");
                return (
                  <MaterialCard
                    key={material.id}
                    variant="rich"
                    href={`/materials/${material.id}`}
                    name={material.name}
                    maker={material.manufacturer_name}
                    rating={material.avg_rating}
                    reviewCount={material.review_count}
                    reportCount={counts.report_count}
                    savedCount={counts.saved_count}
                    description={material.description ?? undefined}
                    categories={material.material_ingredient_categories.map(
                      (row) => row.ingredient_categories.name,
                    )}
                    evidence={evidence}
                    imageSrc={material.imageUrl ?? undefined}
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
