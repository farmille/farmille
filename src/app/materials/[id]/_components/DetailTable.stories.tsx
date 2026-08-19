import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialDetailTable } from "./DetailTable";
import { materialDetail } from "./story-fixtures";

const meta = {
  title: "App/Materials/DetailTable",
  component: MaterialDetailTable,
  args: { material: materialDetail },
} satisfies Meta<typeof MaterialDetailTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Official: Story = {};

export const UnclaimedWithMissingValues: Story = {
  args: {
    material: {
      ...materialDetail,
      seller_id: null,
      general_use: null,
      ingredients: null,
      mechanism: null,
      tags: [],
    },
  },
};
