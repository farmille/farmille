import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TokenCatalog } from "./TokenCatalog";

const meta = {
  title: "Design System/Tokens",
  component: TokenCatalog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TokenCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {};
