import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { SideSection } from "./SideSection";

const meta = {
  title: "Pages/search/SideSection",
  component: SideSection,
  args: {
    title: "作物で探す",
    note: "文字検索はすべての作目・別名が対象です。",
    filter: {
      label: "作物名で検索",
      placeholder: "作物名で検索（例：ミニトマト、いちご）",
      empty: "該当する作物がありません",
      items: [
        { key: "tomato", terms: ["トマト", "ミニトマト"], node: <span>トマト</span> },
        { key: "onion", terms: ["たまねぎ"], node: <span>たまねぎ</span> },
      ],
    },
    children: <p>タグの一覧</p>,
  },
} satisfies Meta<typeof SideSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /作物で探す/ }));
  },
};
export const WithHint: Story = {
  args: {
    title: "施用方法で探す",
    hint: "資材の使い方（散布・灌注・浸漬など）",
    filter: undefined,
  },
};
export const NoFilter: Story = { args: { filter: undefined, note: undefined } };
export const NoMatch: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /作物で探す/ }));
    await userEvent.type(within(canvasElement).getByRole("searchbox"), "該当なし");
  },
};
