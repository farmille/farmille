import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeHeroModel } from "./HomeHeroModel";

const meta = {
  title: "Pages/Home/HomeHeroModel",
  component: HomeHeroModel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className={css({ h: "96", bg: "primary.800" })}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeHeroModel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
