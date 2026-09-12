import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { HomeSearchEntry } from "./HomeSearchEntry";

const meta = {
  title: "Components/Search/HomeSearchEntry",
  component: HomeSearchEntry,
} satisfies Meta<typeof HomeSearchEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 写真の上に重ねる前提の白文字なので、単体 Story は背景が白いまま読みにくくてよい。
// 送信すると Storybook の iframe ごと /search へ遷移してしまうため、play は入力までにとどめる。
export const Typed: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole("searchbox", {
        name: "資材を検索する。作物、悩み、資材名から探せます",
      }),
      "トマト",
    );
  },
};
