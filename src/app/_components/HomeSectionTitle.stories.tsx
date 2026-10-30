import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeSectionTitle } from "./HomeSectionTitle";

const meta = {
  title: "Pages/Home/HomeSectionTitle",
  component: HomeSectionTitle,
  args: { eyebrow: "Messages", id: "story-heading", title: "応援メッセージ" },
} satisfies Meta<typeof HomeSectionTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Headline: Story = {};
export const Centered: Story = { args: { align: "center" } };

export const Voice: Story = {
  args: { eyebrow: "Concept", kind: "voice", title: "「本当にうちの畑で効くのだろうか？」" },
};

export const Inverse: Story = {
  args: { eyebrow: "Search", title: "資材をさがす", tone: "inverse", align: "center" },
  decorators: [
    (Story) => (
      <div className={css({ p: "8", bg: "surface.forest" })}>
        <Story />
      </div>
    ),
  ],
};
