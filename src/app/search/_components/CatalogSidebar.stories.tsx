import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { CatalogSidebar } from "./CatalogSidebar";
import { storyCatalog, storyIds, storySearchCatalog } from "./story-fixtures";

const meta = {
  title: "App/Search/CatalogSidebar",
  component: CatalogSidebar,
  args: {
    catalog: storyCatalog,
    search: storySearchCatalog,
    selected: [],
    sort: "newest",
    query: "",
  },
} satisfies Meta<typeof CatalogSidebar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = {
  args: {
    selected: [
      { kind: "filter", category: "effect", id: storyIds.nutrient, name: "養分吸収の改善" },
      { kind: "filter", category: "genre", id: storyIds.microbe, name: "微生物資材" },
      { kind: "filter", category: "crop", id: storyIds.onion, name: "たまねぎ" },
    ],
    sort: "rating",
    query: "植物",
  },
};

export const Expanded: Story = {
  args: Selected.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole("button", { expanded: false })) {
      await userEvent.click(button);
    }
    for (const summary of canvasElement.querySelectorAll("summary")) {
      await userEvent.click(summary);
    }
  },
};

export const FilterNoMatch: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("searchbox", { name: "効果名で検索" }),
      "該当なし",
    );
  },
};

export const FilterMatch: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("searchbox", { name: "作物名で検索" }),
      "トマト",
    );
  },
};
