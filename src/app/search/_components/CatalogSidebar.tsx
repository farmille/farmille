import Link from "next/link";
import type { ReactNode } from "react";

import {
  buildSearchHref,
  selectedFilterKey,
  type SelectedSearchFilter,
  type MaterialSortParam,
} from "@/components/search/search-selection";
import type { CatalogSearch } from "@/server/queries/catalog-search";
import type { SearchCatalog, SearchFilterItem } from "@/lib/material-search";
import { cropAncestors } from "@/lib/catalog-search";

/** 見本の開閉行（`data-sectoggle`）。見本は JS で開閉するので details/summary で組む。 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ts-pg" style={{ padding: "8px 12px" }}>
      <details>
        <summary>
          <span className="sec-title">{title}</span>
          <span className="caret" aria-hidden="true" />
        </summary>
        <div style={{ paddingTop: 2 }}>{children}</div>
      </details>
    </div>
  );
}

/**
 * 見本 S.search の絞り込みパネル（`aside.s-side > .ts-panel`）。
 * 各条件は検索ページへのリンク（押すと条件の追加・解除）。並びと件数の出し方は本番のまま。
 */
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
  function hrefFor(filter: SelectedSearchFilter) {
    const key = selectedFilterKey(filter);
    const active = selectedKeys.has(key);
    const next = active
      ? selected.filter((item) => selectedFilterKey(item) !== key)
      : [...selected, filter];
    return { href: buildSearchHref({ filters: next, sort, query }), active, key };
  }
  /** 見本の qchip（`.qchip`、選択中は `.on`）。 */
  function chip(filter: SelectedSearchFilter, label = filter.name) {
    const { href, active, key } = hrefFor(filter);
    return (
      <Link
        key={key}
        href={href}
        rel="nofollow"
        aria-current={active ? "true" : undefined}
        className={active ? "qchip on" : "qchip"}
        scroll={false}
      >
        {label}
      </Link>
    );
  }
  /** 見本の件数つきの候補行（`.sug` ＋ `.alias-note`）。 */
  function row(filter: SelectedSearchFilter, count: number) {
    const { href, active, key } = hrefFor(filter);
    return (
      <Link
        key={key}
        href={href}
        rel="nofollow"
        aria-current={active ? "true" : undefined}
        className="sug"
        scroll={false}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 2px" }}
      >
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700 }}>
          {active ? "✓ " : ""}
          {filter.name}
        </span>
        <span className="alias-note tnum" style={{ flex: "0 0 auto" }}>
          {count}
        </span>
      </Link>
    );
  }
  const tag = (filter: SearchFilterItem) => chip({ ...filter, kind: "filter" });
  const cropCounts = new Map<string, number>();
  const groupCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  for (const material of catalog.materials) {
    for (const item of material.material_crops)
      cropCounts.set(item.crop_id, (cropCounts.get(item.crop_id) ?? 0) + 1);
    for (const item of material.material_crop_groups)
      groupCounts.set(item.crop_group_id, (groupCounts.get(item.crop_group_id) ?? 0) + 1);
    for (const item of material.material_ingredient_categories)
      genreCounts.set(
        item.ingredient_category_id,
        (genreCounts.get(item.ingredient_category_id) ?? 0) + 1,
      );
  }
  function groupChip(group: CatalogSearch["groups"][number]) {
    const count = groupCounts.get(group.id) ?? 0;
    return count
      ? chip(
          { kind: "filter", category: "crop_group", id: group.id, name: group.name },
          `${group.name}：全般として記載 ${count}件`,
        )
      : null;
  }
  function cropChip(crop: CatalogSearch["crops"][number]) {
    return chip({ kind: "filter", category: "crop", id: crop.id, name: crop.name });
  }
  const genres = search.filters
    .filter((filter) => filter.category === "genre")
    .toSorted((a, b) => (genreCounts.get(b.id) ?? 0) - (genreCounts.get(a.id) ?? 0));

  return (
    <aside aria-label="資材の絞り込み" className="s-side">
      <div className="ts-panel">
        <div style={{ padding: "10px 12px 0" }}>
          <Link
            href="/search"
            className="ts-clear"
            style={{ width: "100%", textAlign: "center", padding: 8 }}
          >
            すべての条件をクリア
          </Link>
        </div>
        <div className="logic-hint" style={{ padding: "6px 12px 2px" }}>
          作物 × 効果 など、条件を組み合わせて検索できます
        </div>
        <Section title="効果分類で探す">
          <div className="sug-chips">
            {search.filters.filter((filter) => filter.category === "effect").map(tag)}
          </div>
        </Section>
        <Section title="資材ジャンルで探す">
          <div>
            {genres.map((genre) =>
              row({ ...genre, kind: "filter" }, genreCounts.get(genre.id) ?? 0),
            )}
          </div>
        </Section>
        <Section title="作物で探す">
          <div className="fguide" style={{ margin: "2px 0 6px" }}>
            文字検索はすべての作目・別名が対象です。下のタグ一覧は、資材に記載のある作目だけを表示しています。
          </div>
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
                <details key={major.id} className="crop-major">
                  <summary>
                    <span style={{ color: "var(--green)", fontSize: 11 }} aria-hidden="true">
                      ▸
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>{major.name}</span>
                    <span className="alias-note" style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}>
                      記載あり {visible.length}品目
                    </span>
                  </summary>
                  <div className="sug-chips">
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
                        <p className="sub-title">{group.name}</p>
                        <div className="sug-chips">
                          {groupChip(group)}
                          {crops.map(cropChip)}
                        </div>
                      </div>
                    );
                  })}
                </details>
              );
            })}
          <div className="fguide" style={{ marginTop: 8, marginBottom: 2 }}>
            一覧には、資材に記載のある作目だけを表示しています。ここにない作目も、検索窓からすべて探せます。
          </div>
        </Section>
        <Section title={`メーカーから探す（全${search.makers.length}社）`}>
          <div className="sug-chips">
            {search.makers.map((name) => chip({ kind: "maker", name }))}
          </div>
        </Section>
        <Section title="施用方法で探す">
          <div className="sug-chips">
            {search.filters.filter((filter) => filter.category === "method").map(tag)}
          </div>
        </Section>
      </div>
    </aside>
  );
}
