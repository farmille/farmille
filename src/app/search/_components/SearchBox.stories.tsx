import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { SearchBox } from "./SearchBox";
import { storyIds, storySearchCatalog } from "./story-fixtures";

const meta = {
  title: "App/Search/SearchBox",
  component: SearchBox,
  args: { initialQuery: "", selected: [], sort: "reviews", catalog: storySearchCatalog },
} satisfies Meta<typeof SearchBox>;
export default meta;
type Story = StoryObj<typeof meta>;

async function openSuggestions(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("combobox", { name: "資材の検索条件" }));
  await userEvent.keyboard("{ArrowDown}");
  return within(canvasElement.ownerDocument.body);
}

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
export const Suggestions: Story = {
  args: { initialQuery: "ト" },
  play: async ({ canvasElement }) => {
    const page = await openSuggestions(canvasElement);
    await waitFor(() => expect(page.getAllByRole("option").length).toBeGreaterThan(0));
  },
};
export const NoSuggestion: Story = {
  args: { initialQuery: "該当なし" },
  play: async ({ canvasElement }) => {
    const page = await openSuggestions(canvasElement);
    await waitFor(() =>
      expect(page.getByText("「該当なし」に一致する候補がありません")).toBeVisible(),
    );
  },
};
