import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { listSearchFiltersByRefs } from "@/server/queries/classifications";

import Page from "./page";
import { storyIds, storySearchCatalog } from "./_components/story-fixtures";
import { preparePageSession } from "../../../.storybook/page-session";

const meta = {
  title: "Pages/search",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/search" } } },
  args: { searchParams: Promise.resolve({}) },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;

/** URL の条件を、見本の検索候補から解決する。 */
function resolveFilters(...ids: string[]) {
  return () => {
    mocked(listSearchFiltersByRefs).mockResolvedValue({
      ok: true,
      data: storySearchCatalog.filters.filter((filter) => ids.includes(filter.id)),
    });
  };
}

export const Default: Story = {};

/** 作物と効果を1つずつ選んだ状態。帯の写真が作物に替わり、効果の件数はその作物の中で数える。 */
export const CropAndEffectSelected: Story = {
  beforeEach: resolveFilters(storyIds.tomato, storyIds.nutrient),
  args: {
    searchParams: Promise.resolve({
      filters: `crop:${storyIds.tomato},effect:${storyIds.nutrient}`,
    }),
  },
};

/** サイドバーから作物を2つ選んだ状態。見出しに両方の作物を出す。 */
export const MultipleCrops: Story = {
  beforeEach: resolveFilters(storyIds.tomato, storyIds.onion),
  args: {
    searchParams: Promise.resolve({ filters: `crop:${storyIds.tomato},crop:${storyIds.onion}` }),
  },
};
