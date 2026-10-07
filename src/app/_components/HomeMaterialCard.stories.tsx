import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeMaterialCard } from "./HomeMaterialCard";
import { homeMaterials } from "./story-fixtures";

const meta = {
  title: "App/Home/HomeMaterialCard",
  component: HomeMaterialCard,
  decorators: [
    (Story) => <div className={css({ display: "flex", gap: "3", p: "4" })}>{Story()}</div>,
  ],
  args: homeMaterials[0],
} satisfies Meta<typeof HomeMaterialCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongNoImage: Story = { args: homeMaterials[1] };
export const NoCounts: Story = { args: homeMaterials[2] };
