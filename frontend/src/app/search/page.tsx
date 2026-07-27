import type { Metadata } from "next";

import { AppBar, EmptyState, MaterialCard } from "@/components";
import { BottomNav } from "@/components/bottom-nav";
import { SearchSortSelect } from "@/components/search/search-sort-select";
import { TagSearchBox } from "@/components/search/tag-search-box";
import {
  formatLogicHint,
  parseSortParam,
  parseTagsQuery,
  resolveSelectedTags,
} from "@/components/search/tag-selection";
import { createPageMetadata } from "@/lib/seo";
import { listMaterials } from "@/server/queries/materials";
import {
  listSearchSuggestions,
  listTagsByIds,
  listTagsByPairs,
  POPULAR_TAG_PAIRS,
  SEASONAL_TAG_PAIRS,
} from "@/server/queries/tags";
import { css } from "../../../styled-system/css";

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
  px: "4",
  pt: "3",
  pb: "4",
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
});

type SearchPageProps = {
  searchParams: Promise<{ tags?: string; sort?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const sort = parseSortParam(params.sort);

  let tagIds: string[] = [];
  let makerNames: string[] = [];
  let materialNames: string[] = [];

  try {
    ({ tagIds, makerNames, materialNames } = parseTagsQuery(params.tags));
  } catch {
    return (
      <div className={shell}>
        <AppBar title="BS資材を探す" backHref="/" />
        <main className={main}>
          <EmptyState
            title="検索条件が正しくありません"
            description="URL の tags パラメータを確認するか、条件を選び直してください。"
          />
        </main>
        <BottomNav active="search" />
      </div>
    );
  }

  const [tagsResult, popularResult, seasonalResult, catalogResult] = await Promise.all([
    listTagsByIds(tagIds),
    listTagsByPairs(POPULAR_TAG_PAIRS),
    listTagsByPairs(SEASONAL_TAG_PAIRS),
    listSearchSuggestions(),
  ]);

  if (!popularResult.ok || !seasonalResult.ok || !catalogResult.ok) {
    throw new Error("タグ候補の取得に失敗しました。");
  }

  if (!tagsResult.ok) {
    return (
      <div className={shell}>
        <AppBar title="BS資材を探す" backHref="/" />
        <main className={main}>
          <EmptyState
            title="指定されたタグが見つかりません"
            description="条件を選び直して、もう一度検索してください。"
          />
        </main>
        <BottomNav active="search" />
      </div>
    );
  }

  const selected = resolveSelectedTags({
    tagIds,
    makerNames,
    materialNames,
    tagsById: new Map(tagsResult.data.map((tag) => [tag.id, tag])),
  });

  const materialsResult = await listMaterials({
    tagIds: tagIds.length > 0 ? tagIds : undefined,
    makerNames: makerNames.length > 0 ? makerNames : undefined,
    materialNames: materialNames.length > 0 ? materialNames : undefined,
    sort,
    page: 1,
  });

  if (!materialsResult.ok) {
    throw new Error(`資材検索に失敗しました: ${materialsResult.error}`);
  }

  const { items, total } = materialsResult.data;
  const logic = formatLogicHint(selected);

  return (
    <div className={shell}>
      <AppBar title="BS資材を探す" backHref="/" />
      <main className={main}>
        <TagSearchBox
          variant="search"
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
            {items.map((material) => (
              <MaterialCard
                key={material.id}
                variant="list"
                name={material.name}
                maker={material.manufacturer_name}
                rating={material.avg_rating ?? 0}
                reviewCount={material.review_count}
                official={material.seller_id !== null}
                imageSrc={material.primaryImage?.url}
                description={material.description ?? undefined}
                href={`/materials/${material.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="条件に合う資材が見つかりませんでした"
            description="タグの組み合わせを変えるか、条件を減らして再度お試しください。"
          />
        )}
      </main>
      <BottomNav active="search" />
    </div>
  );
}
