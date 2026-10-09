import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialSourceLinks } from "./MaterialSourceLinks";
import { materialLinks } from "./story-fixtures";

const meta = {
  title: "App/Materials/MaterialSourceLinks",
  component: MaterialSourceLinks,
  args: { links: materialLinks },
} satisfies Meta<typeof MaterialSourceLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unclassified: Story = {
  args: {
    links: [{ group: null, title: "分類前の資料", url: "https://example.com/a.pdf", trial: null }],
  },
};

export const Empty: Story = {
  args: { links: [] },
};
