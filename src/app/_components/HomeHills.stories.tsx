import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeHills } from "./HomeHills";

const meta = {
  title: "Pages/Home/HomeHills",
  component: HomeHills,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeHills>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IntoPaper: Story = {
  args: { into: "paper" },
  decorators: [
    (Story) => (
      <div className={css({ pt: "16", bg: "surface.forest" })}>
        <Story />
      </div>
    ),
  ],
};

export const IntoForest: Story = {
  args: { into: "forest" },
  decorators: [
    (Story) => (
      <div className={css({ pt: "16", bg: "surface.paper" })}>
        <Story />
      </div>
    ),
  ],
};
