import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { CatalogSidebar } from "./CatalogSidebar";
import { storyCatalog, storyIds, storySearchCatalog } from "./story-fixtures";

const meta = {
  title: "Pages/search/CatalogSidebar",
  component: CatalogSidebar,
  args: {
    catalog: storyCatalog,
    search: storySearchCatalog,
    selected: [],
    sort: "newest",
    query: "",
    resultCount: 17,
  },
} satisfies Meta<typeof CatalogSidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

// スマホとタブレットでは区分のチップからシートを開き、PCでは左の列の区分を開く。どちらの幅でも同じ操作を試せるようにする。
async function openSection(canvasElement: HTMLElement, chipName: string, sectionTitle: RegExp) {
  const chip = within(canvasElement).queryByRole("button", { name: new RegExp(`^${chipName}`) });
  if (chip !== null) {
    await userEvent.click(chip);
    return within(within(canvasElement.ownerDocument.body).getByRole("dialog"));
  }
  await userEvent.click(within(canvasElement).getByRole("button", { name: sectionTitle }));
  return within(canvasElement);
}

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
    resultCount: 3,
  },
};

export const Expanded: Story = {
  args: Selected.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // スマホ幅では左の列を出さないので、開く対象は PC 幅でだけ見つかる
    for (const button of canvas.queryAllByRole("button", { expanded: false })) {
      await userEvent.click(button);
    }
    for (const summary of canvasElement.querySelectorAll("summary")) {
      if (summary.checkVisibility()) await userEvent.click(summary);
    }
  },
};

export const FilterNoMatch: Story = {
  play: async ({ canvasElement }) => {
    const scope = await openSection(canvasElement, "効果分類", /効果分類で探す/);
    await userEvent.type(scope.getByRole("searchbox", { name: "効果名で検索" }), "該当なし");
  },
};

export const FilterMatch: Story = {
  play: async ({ canvasElement }) => {
    const scope = await openSection(canvasElement, "作物", /作物で探す/);
    await userEvent.type(scope.getByRole("searchbox", { name: "作物名で検索" }), "トマト");
  },
};

export const Pc: Story = {
  args: Selected.args,
  globals: { viewport: { value: "desktop1440", isRotated: false } },
};

export const MobileSheet: Story = {
  args: Selected.args,
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).queryByRole("button", { name: /^絞り込み/ });
    if (chip !== null) await userEvent.click(chip);
  },
};
