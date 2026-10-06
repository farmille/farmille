import Link from "next/link";

import {
  buildSearchHref,
  selectedFilterKey,
  type SelectedSearchFilter,
  type MaterialSortParam,
} from "@/components/search/search-selection";
import type { CatalogSearch } from "@/server/queries/catalog-search";
import type { SearchCatalog, SearchFilterItem } from "@/lib/material-search";
import { cropAncestors } from "@/lib/catalog-search";

import { SideSection, type SideFilterItem } from "./SideSection";

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
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700 }}>{filter.name}</span>
        <span className="alias-note tnum" style={{ flex: "0 0 auto" }}>
          {count}
        </span>
        <span className="sug-mark" aria-hidden="true" />
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
  // 見本の EFF_GROUPS4：JBSA の効果大分類（4区分）ごとに開閉行を置き、中に個別効果のタグを並べる。
  // catalog.effects は大分類の表示順 → 個別効果の表示順に並んでいる。
  const effectGroups: Array<{ id: string; name: string; effects: CatalogSearch["effects"] }> = [];
  for (const effect of catalog.effects) {
    const group = effectGroups.at(-1);
    if (group?.id === effect.categoryId) group.effects.push(effect);
    else effectGroups.push({ id: effect.categoryId, name: effect.categoryName, effects: [effect] });
  }
  // 見本どおり、掲載資材のない資材ジャンルは出さない（選択中のものは外せるよう残す）。
  const genres = search.filters
    .filter(
      (filter) =>
        filter.category === "genre" &&
        ((genreCounts.get(filter.id) ?? 0) > 0 ||
          selectedKeys.has(selectedFilterKey({ ...filter, kind: "filter" }))),
    )
    .toSorted((a, b) => (genreCounts.get(b.id) ?? 0) - (genreCounts.get(a.id) ?? 0));

  /** 見本 selHtml：区分ごとの選択中の条件（`.chip-sel`）。× で その条件だけを外す。 */
  function selectedChips(match: (filter: SelectedSearchFilter) => boolean) {
    const items = selected.filter(match);
    if (!items.length) return null;
    return (
      <div className="sug-chips side-selected">
        {items.map((filter) => {
          const { href, key } = hrefFor(filter);
          return (
            <span key={key} className="chip-sel">
              <span className="cat-mini">選択中</span>
              {filter.name}
              <Link
                href={href}
                rel="nofollow"
                scroll={false}
                className="chip-x"
                aria-label={`${filter.name}の条件を外す`}
              >
                ×
              </Link>
            </span>
          );
        })}
      </div>
    );
  }
  const isFilter = (...categories: SearchFilterItem["category"][]) =>
    function (filter: SelectedSearchFilter) {
      return filter.kind === "filter" && categories.includes(filter.category);
    };
  function filterItems(filters: SearchFilterItem[]): SideFilterItem[] {
    return filters.map((filter) => ({
      key: `${filter.category}:${filter.id}`,
      terms: [filter.name, ...filter.aliases],
      node: tag(filter),
    }));
  }
  const conditionCount = selected.length + (query ? 1 : 0);

  return (
    <aside aria-label="資材の絞り込み" className="s-side">
      <div className="ts-panel">
        {conditionCount > 0 ? (
          <div className="side-clear">
            <span>選択中の条件 {conditionCount}件</span>
            <Link href="/search" className="ts-clear">
              すべての条件をクリア
            </Link>
          </div>
        ) : null}
        <div className="logic-hint" style={{ padding: "8px 12px 2px" }}>
          作物 × 効果 など、条件を組み合わせて検索できます
        </div>
        <SideSection
          title="効果分類で探す"
          selected={selectedChips(isFilter("effect"))}
          filter={{
            label: "効果名で検索",
            placeholder: "効果名で検索（例：耐暑）",
            empty: "該当する効果がありません",
            items: filterItems(search.filters.filter((filter) => filter.category === "effect")),
          }}
        >
          {effectGroups.map((group) => (
            <details key={group.id} className="eff-group">
              <summary className="sug">
                <span className="eff-caret" aria-hidden="true" />
                <span style={{ flex: 1, minWidth: 0 }}>{group.name}</span>
                <span className="alias-note" style={{ flex: "0 0 auto" }}>
                  {group.effects.length}効果
                </span>
              </summary>
              <div className="sug-chips eff-chips">
                {group.effects.map((effect) =>
                  chip({ kind: "filter", category: "effect", id: effect.id, name: effect.name }),
                )}
              </div>
            </details>
          ))}
        </SideSection>
        <SideSection title="資材ジャンルで探す" selected={selectedChips(isFilter("genre"))}>
          <div>
            {genres.map((genre) =>
              row({ ...genre, kind: "filter" }, genreCounts.get(genre.id) ?? 0),
            )}
          </div>
        </SideSection>
        <SideSection
          title="作物で探す"
          selected={selectedChips(isFilter("crop", "crop_group"))}
          filter={{
            label: "作物名で検索",
            placeholder: "作物名で検索（例：トマト、柿）",
            empty: "該当する作物がありません",
            items: filterItems(
              search.filters.filter(
                (filter) => filter.category === "crop" || filter.category === "crop_group",
              ),
            ),
          }}
          note="文字検索はすべての作目・別名が対象です。下のタグ一覧は、資材に記載のある作目だけを表示しています。"
        >
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
        </SideSection>
        <SideSection
          title={`メーカーから探す（全${search.makers.length}社）`}
          selected={selectedChips((filter) => filter.kind === "maker")}
          filter={{
            label: "メーカー名で絞り込み",
            placeholder: "メーカー名で絞り込み",
            empty: "該当するメーカーがありません",
            items: search.makers.map((name) => ({
              key: `maker:${name}`,
              terms: [name],
              node: chip({ kind: "maker", name }),
            })),
          }}
        >
          <div className="sug-chips">
            {search.makers.map((name) => chip({ kind: "maker", name }))}
          </div>
        </SideSection>
        <SideSection title="施用方法で探す" selected={selectedChips(isFilter("method"))}>
          <div className="sug-chips">
            {search.filters.filter((filter) => filter.category === "method").map(tag)}
          </div>
        </SideSection>
      </div>
    </aside>
  );
}
