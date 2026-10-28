import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CropLine } from "./CropLine";

const meta = {
  title: "Components/Display/CropLine",
  component: CropLine,
  args: { crops: ["ミニトマト"] },
} satisfies Meta<typeof CropLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const ManyCrops: Story = {
  args: {
    crops: ["トマト", "ミニトマト", "きゅうり", "なす", "ピーマン", "ホースラディッシュ"],
  },
};
