import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { SearchFilterSheet } from "./SearchFilterSheet";

const meta = {
  title: "Pages/search/SearchFilterSheet",
  component: SearchFilterSheet,
  args: {
    resultCount: 17,
    searchBox: <input type="search" aria-label="資材の検索条件" />,
    categories: [
      { key: "effect", label: "効果分類", count: 0 },
      { key: "genre", label: "資材ジャンル", count: 0 },
      { key: "crop", label: "作物", count: 0 },
      { key: "maker", label: "メーカー", count: 0 },
      { key: "method", label: "施用方法", count: 0 },
    ],
    children: <p>絞り込みの項目</p>,
  },
} satisfies Meta<typeof SearchFilterSheet>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = {
  args: {
    resultCount: 3,
    categories: [
      { key: "effect", label: "効果分類", count: 1 },
      { key: "genre", label: "資材ジャンル", count: 0 },
      { key: "crop", label: "作物", count: 1 },
      { key: "maker", label: "メーカー", count: 0 },
      { key: "method", label: "施用方法", count: 0 },
    ],
  },
};
export const Open: Story = {
  args: Selected.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^絞り込み/ }));
  },
};
