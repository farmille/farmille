import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { compareMaterials } from "../../_components/story-fixtures";
import { CompareTable } from "./CompareTable";

const meta = {
  title: "App/Me/Saved/CompareTable",
  component: CompareTable,
  args: { materials: compareMaterials },
} satisfies Meta<typeof CompareTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeMaterials: Story = {};

export const TwoMaterials: Story = {
  args: { materials: compareMaterials.slice(0, 2) },
};
