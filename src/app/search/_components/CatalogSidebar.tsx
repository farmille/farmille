import Link from "next/link";
import { buttonRecipe } from "@/components";
import {
  buildSearchHref,
  selectedFilterKey,
  type SelectedSearchFilter,
  type MaterialSortParam,
} from "@/components/search/search-selection";
import type { CatalogSearch } from "@/server/queries/catalog-search";
import type { SearchCatalog, SearchFilterItem } from "@/lib/material-search";
import { cropAncestors } from "@/lib/catalog-search";
import { css } from "../../../../styled-system/css";

const list = css({ display: "flex", flexWrap: "wrap", gap: "2", py: "2" });
const section = css({ borderBottomWidth: "1px", borderColor: "border.default", py: "3" });
const summary = css({ fontSize: "md", fontWeight: "700", cursor: "pointer" });

export function CatalogSidebar({
  catalog,
  search,
  selected,
  sort,
  query,
}: {
  catalog: CatalogSearch;
  search: SearchCatalog;
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  query: string;
}) {
  const selectedKeys = new Set(selected.map(selectedFilterKey));
  function choice(filter: SelectedSearchFilter, label = filter.name) {
    const key = selectedFilterKey(filter);
    const active = selectedKeys.has(key);
    const next = active
      ? selected.filter((item) => selectedFilterKey(item) !== key)
      : [...selected, filter];
    return (
      <Link
        key={key}
        href={buildSearchHref({ filters: next, sort, query })}
        rel="nofollow"
        aria-current={active ? "true" : undefined}
        className={buttonRecipe({ variant: active ? "primary" : "ghost", size: "sm" })}
        scroll={false}
      >
        {label}
      </Link>
    );
  }
  const tag = (filter: SearchFilterItem) => choice({ ...filter, kind: "filter" });
  const cropCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  for (const material of catalog.materials) {
    for (const row of material.material_crops)
      cropCounts.set(row.crop_id, (cropCounts.get(row.crop_id) ?? 0) + 1);
    for (const row of material.material_crop_groups)
      groupCounts.set(row.crop_group_id, (groupCounts.get(row.crop_group_id) ?? 0) + 1);
  }
  function groupChip(group: CatalogSearch["groups"][number]) {
    const count = groupCounts.get(group.id) ?? 0;
    return count
      ? choice(
          { kind: "filter", category: "crop_group", id: group.id, name: group.name },
          `${group.name}：全般として記載 ${count}件`,
        )
      : null;
  }
  function cropChip(crop: CatalogSearch["crops"][number]) {
    return choice({ kind: "filter", category: "crop", id: crop.id, name: crop.name });
  }
  return (
    <aside
      aria-label="資材の絞り込み"
      className={css({
        minW: "0",
        p: "3",
        bg: "surface.card",
        borderRadius: "card",
        alignSelf: "start",
      })}
    >
      <Link
        href="/search"
        className={css({ color: "primary.700", fontSize: "md", fontWeight: "700" })}
      >
        すべてクリア
      </Link>
      <details className={section}>
        <summary className={summary}>効果分類</summary>
        <div className={list}>
          {search.filters.filter((filter) => filter.category === "effect").map(tag)}
        </div>
      </details>
      <details className={section}>
        <summary className={summary}>資材ジャンル</summary>
        <div className={list}>
          {search.filters.filter((filter) => filter.category === "genre").map(tag)}
        </div>
      </details>
      <details className={section}>
        <summary className={summary}>作物</summary>
        <p className={css({ fontSize: "xs", color: "text.subtle" })}>
          文字検索はすべての作目・別名が対象。タグ一覧は資材に記載のある作目のみ。
        </p>
        {catalog.groups
          .filter((group) => group.hierarchy_level === "major")
          .map((major) => {
            const groups = catalog.groups.filter((group) => group.parent_id === major.id);
            const visible = catalog.crops.filter(
              (crop) =>
                cropCounts.has(crop.id) &&
                cropAncestors(crop.groupId, catalog.groups).includes(major.id),
            );
            if (
              !visible.length &&
              !groupCounts.has(major.id) &&
              !groups.some((group) => groupCounts.has(group.id))
            )
              return null;
            return (
              <details key={major.id} className={section}>
                <summary className={summary}>
                  {major.name}（記載あり {visible.length}品目）
                </summary>
                <div className={list}>
                  {groupChip(major)}
                  {visible
                    .filter(
                      (crop) =>
                        crop.groupId === major.id ||
                        (visible.length <= 8 && !groupCounts.has(crop.groupId)),
                    )
                    .map(cropChip)}
                </div>
                {groups.map((group) => {
                  const crops = visible.filter((crop) => crop.groupId === group.id);
                  if ((!crops.length || visible.length <= 8) && !groupCounts.has(group.id))
                    return null;
                  return (
                    <div key={group.id}>
                      <p className={css({ fontSize: "sm", fontWeight: "700", mb: "1" })}>
                        {group.name}
                      </p>
                      <div className={list}>
                        {groupChip(group)}
                        {crops.map(cropChip)}
                      </div>
                    </div>
                  );
                })}
              </details>
            );
          })}
      </details>
      <details className={section}>
        <summary className={summary}>メーカー</summary>
        <div className={list}>{search.makers.map((name) => choice({ kind: "maker", name }))}</div>
      </details>
      <details className={section}>
        <summary className={summary}>施用方法</summary>
        <div className={list}>
          {search.filters.filter((filter) => filter.category === "method").map(tag)}
        </div>
      </details>
    </aside>
  );
}
