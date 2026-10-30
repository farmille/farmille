import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import Page from "./loading";

const materialPath = "/materials/00000000-0000-4000-8000-000000000101";

const meta = {
  title: "Pages/materials/[id]/review/Loading",
  component: Page,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: `${materialPath}/review/new` } },
  },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 読み込み中も、戻り先は開いている感想口コミの資材ページにする。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const back = within(canvasElement).getAllByRole("link", { name: "戻る" })[0];
    await expect(back).toHaveAttribute("href", materialPath);
  },
};
