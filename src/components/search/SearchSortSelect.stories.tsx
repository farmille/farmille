import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchSortSelect } from "./SearchSortSelect";
import type { SelectedSearchFilter } from "./search-selection";

const selectedFilters: SelectedSearchFilter[] = [
  {
    kind: "filter",
    id: "3f9c2a10-8f4b-4c1d-9a6e-5b7d0c2e4f81",
    name: "ミニトマト",
    category: "crop",
  },
  { kind: "maker", name: "グリーンバイオ株式会社" },
];

const meta = {
  title: "Components/Search/SearchSortSelect",
  component: SearchSortSelect,
  args: {
    selected: [],
    sort: "reviews",
  },
  parameters: {
    nextjs: { navigation: { pathname: "/search" } },
  },
} satisfies Meta<typeof SearchSortSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/** レビューが多い順（既定） */
export const Reviews: Story = {};

/** 評価が高い順 */
export const Rating: Story = {
  args: { sort: "rating" },
};

/** 新着順 */
export const Newest: Story = {
  args: { sort: "newest" },
};

/** タグ選択中（並び替え変更後も選択タグを保持した URL を生成する） */
export const WithSelectedTags: Story = {
  args: {
    selected: selectedFilters,
    sort: "rating",
  },
};
