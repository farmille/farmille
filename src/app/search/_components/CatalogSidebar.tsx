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
import { chipRecipe as selectedChipRecipe } from "@/components/Chip";
import { Icon } from "@/components/Icon";

import { css, cva, cx } from "../../../../styled-system/css";

import { chipList, chipListStyle, focusRing } from "./search-chips";
import { SideSection, type SideFilterItem } from "./SideSection";

const chipRecipe = cva({
  base: {
    ...focusRing,
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    py: "1",
    px: "3",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "pill",
    fontSize: "sm",
    textDecoration: "none",
  },
  variants: {
    active: {
      true: {
        bg: "primary.700",
        borderColor: "primary.700",
        color: "text.inverse",
        fontWeight: "bold",
      },
      false: { bg: "surface.card", borderColor: "border.strong", color: "inherit" },
    },
  },
});

const genreRowRecipe = cva({
  base: {
    ...focusRing,
    display: "flex",
    alignItems: "center",
    gap: "2",
    minH: "10",
    py: "2",
    px: "2",
    borderRadius: "input",
    textDecoration: "none",
  },
  variants: {
    active: {
      true: { bg: "primary.100", color: "primary.800" },
      false: { color: "inherit", _hover: { bg: "primary.soft" } },
    },
  },
});

const selectedChip = selectedChipRecipe({ size: "sm", removable: true });

const countNoteStyle = css({ flex: "none", color: "text.subtle", fontSize: "xs" });

const summaryBase = css.raw(focusRing, {
  display: "flex",
  alignItems: "center",
  gap: "2",
  listStyle: "none",
  cursor: "pointer",
  "&::-webkit-details-marker": { display: "none" },
});

const effectSummaryStyle = css(summaryBase, {
  py: "2",
  px: "1.5",
  borderRadius: "input",
  fontSize: "md",
  fontWeight: "semibold",
  _hover: { bg: "primary.soft" },
});

const cropSummaryStyle = css(summaryBase, {
  py: "1.5",
  px: "0.5",
  fontSize: "md",
  fontWeight: "semibold",
});

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
  function chip(filter: SelectedSearchFilter, label = filter.name) {
    const { href, active, key } = hrefFor(filter);
    return (
      <Link
        key={key}
        href={href}
        rel="nofollow"
        aria-current={active ? "true" : undefined}
        className={chipRecipe({ active })}
        scroll={false}
      >
        {active ? <span aria-hidden="true">✓</span> : null}
        {label}
      </Link>
    );
  }
  function row(filter: SelectedSearchFilter, count: number) {
    const { href, active, key } = hrefFor(filter);
    return (
      <Link
        key={key}
        href={href}
        rel="nofollow"
        aria-current={active ? "true" : undefined}
        className={cx("group", genreRowRecipe({ active }))}
        scroll={false}
      >
        <span className={css({ flex: "1", minW: "0", fontSize: "sm", fontWeight: "bold" })}>
          {filter.name}
        </span>
        <span className={cx(countNoteStyle, css({ fontVariantNumeric: "tabular-nums" }))}>
          {count}
        </span>
        <span
          className={
            active
              ? css({ flex: "none", color: "primary.800", fontSize: "xs", fontWeight: "bold" })
              : css({
                  flex: "none",
                  color: "text.subtle",
                  fontWeight: "bold",
                  _groupHover: { color: "primary.800" },
                })
          }
          aria-hidden="true"
        >
          {active ? "✓ 選択中" : "＋"}
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
  const effectGroups: Array<{ id: string; name: string; effects: CatalogSearch["effects"] }> = [];
  for (const effect of catalog.effects) {
    const group = effectGroups.at(-1);
    if (group?.id === effect.categoryId) group.effects.push(effect);
    else effectGroups.push({ id: effect.categoryId, name: effect.categoryName, effects: [effect] });
  }
  const genres = search.filters
    .filter(
      (filter) =>
        filter.category === "genre" &&
        ((genreCounts.get(filter.id) ?? 0) > 0 ||
          selectedKeys.has(selectedFilterKey({ ...filter, kind: "filter" }))),
    )
    .toSorted((a, b) => (genreCounts.get(b.id) ?? 0) - (genreCounts.get(a.id) ?? 0));

  function selectedChips(match: (filter: SelectedSearchFilter) => boolean) {
    const items = selected.filter(match);
    if (!items.length) return null;
    return (
      <div className={css(chipList, { pt: "0", pb: "2" })}>
        {items.map((filter) => {
          const { href, key } = hrefFor(filter);
          return (
            // 外すのは URL の変更なので、Chip の外すボタン（JS の onRemove）ではなく同じ見た目のリンクにする
            <span key={key} className={selectedChip.root}>
              <span className={selectedChip.category}>選択中</span>
              {filter.name}
              <Link
                href={href}
                rel="nofollow"
                scroll={false}
                className={selectedChip.remove}
                aria-label={`${filter.name}の条件を外す`}
              >
                <Icon name="close" size="2xs" />
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
    <aside aria-label="資材の絞り込み" className={css({ pc: { position: "sticky", top: "20" } })}>
      <div
        className={css({
          mt: "2.5",
          bg: "surface.card",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.default",
          borderRadius: "button",
          overflow: "hidden",
          pc: { maxH: "calc(100vh - token(spacing.24))", overflowY: "auto" },
        })}
      >
        {conditionCount > 0 ? (
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2",
              pt: "2.5",
              px: "3",
              color: "text.muted",
              fontSize: "sm",
              fontWeight: "bold",
            })}
          >
            <span>選択中の条件 {conditionCount}件</span>
            <Link
              href="/search"
              className={css({
                py: "2",
                px: "0.5",
                color: "text.subtle",
                fontSize: "sm",
                fontWeight: "normal",
                textDecoration: "underline",
              })}
            >
              すべての条件をクリア
            </Link>
          </div>
        ) : null}
        <div
          className={css({
            mt: "2.5",
            pt: "2",
            px: "3",
            pb: "0.5",
            color: "text.muted",
            fontSize: "xs",
          })}
        >
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
            <details key={group.id}>
              <summary className={effectSummaryStyle}>
                <span
                  className={css({
                    display: "inline-block",
                    color: "primary.700",
                    fontSize: "xs",
                    "details[open] > summary &": { transform: "rotate(90deg)" },
                  })}
                  aria-hidden="true"
                >
                  ▸
                </span>
                <span className={css({ flex: "1", minW: "0" })}>{group.name}</span>
                <span className={countNoteStyle}>{group.effects.length}効果</span>
              </summary>
              <div className={css(chipList, { pr: "1.5", pb: "2.5", pl: "6" })}>
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
                <details
                  key={major.id}
                  className={css({
                    py: "0.5",
                    borderTopWidth: "1px",
                    borderTopStyle: "solid",
                    borderTopColor: "border.default",
                    _firstOfType: { borderTopWidth: "0" },
                  })}
                >
                  <summary className={cropSummaryStyle}>
                    <span
                      className={css({ color: "primary.700", fontSize: "xs" })}
                      aria-hidden="true"
                    >
                      ▸
                    </span>
                    <span className={css({ flex: "1", minW: "0" })}>{major.name}</span>
                    <span className={cx(countNoteStyle, css({ whiteSpace: "nowrap" }))}>
                      記載あり {visible.length}品目
                    </span>
                  </summary>
                  <div className={chipListStyle}>
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
                        <p
                          className={css({
                            mt: "2",
                            mb: "1.5",
                            color: "text.muted",
                            fontSize: "sm",
                            fontWeight: "bold",
                          })}
                        >
                          {group.name}
                        </p>
                        <div className={chipListStyle}>
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
          <div className={chipListStyle}>
            {search.makers.map((name) => chip({ kind: "maker", name }))}
          </div>
        </SideSection>
        <SideSection title="施用方法で探す" selected={selectedChips(isFilter("method"))}>
          <div className={chipListStyle}>
            {search.filters.filter((filter) => filter.category === "method").map(tag)}
          </div>
        </SideSection>
      </div>
    </aside>
  );
}
