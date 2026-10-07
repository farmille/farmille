import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchBox } from "./SearchBox";
import { storyIds, storySearchCatalog } from "./story-fixtures";

const meta = {
  title: "App/Search/SearchBox",
  component: SearchBox,
  args: { initialQuery: "", selected: [], sort: "reviews", catalog: storySearchCatalog },
} satisfies Meta<typeof SearchBox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithSelection: Story = {
  args: {
    selected: [
      { kind: "filter", category: "crop", id: storyIds.onion, name: "たまねぎ" },
      { kind: "filter", category: "effect", id: storyIds.nutrient, name: "養分吸収の改善" },
      { kind: "maker", name: "みどり化成工業" },
    ],
  },
};
export const Suggestions: Story = { args: { initialQuery: "ト" } };
export const NoSuggestion: Story = { args: { initialQuery: "該当なし" } };
