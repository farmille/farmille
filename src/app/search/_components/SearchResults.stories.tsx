import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchResults } from "./SearchResults";
import { storyCatalog, storyIds } from "./story-fixtures";

const meta = {
  title: "App/Search/SearchResults",
  component: SearchResults,
  args: {
    catalog: storyCatalog,
    filters: [],
    makerNames: [],
    materialNames: [],
    sort: "reviews",
    selected: [],
    query: "",
    keywordMatches: undefined,
    logic: "",
  },
} satisfies Meta<typeof SearchResults>;
export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
/** 作物で絞り込むと、直接記載と作物分類としての記載を分けて並べる。 */
export const ByCrop: Story = {
  args: {
    filters: [{ category: "crop", id: storyIds.tomato }],
    selected: [{ kind: "filter", category: "crop", id: storyIds.tomato, name: "トマト" }],
    logic: "トマト",
  },
};
export const NoResult: Story = {
  args: {
    makerNames: ["存在しないメーカー"],
    selected: [{ kind: "maker", name: "存在しないメーカー" }],
    logic: "存在しないメーカー",
  },
};
