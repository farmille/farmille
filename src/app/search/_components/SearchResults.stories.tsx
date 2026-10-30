import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchResults } from "./SearchResults";
import { storyCatalog, storyIds } from "./story-fixtures";

const meta = {
  title: "Pages/search/SearchResults",
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
