import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { savedMaterials } from "../_components/story-fixtures";
import { SavedList } from "./SavedList";

const meta = {
  title: "Pages/me/saved/SavedList",
  component: SavedList,
  args: { items: savedMaterials },
} satisfies Meta<typeof SavedList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { items: [] },
};
