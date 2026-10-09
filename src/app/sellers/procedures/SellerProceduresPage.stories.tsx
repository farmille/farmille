import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SellerProceduresPage from "./page";

const meta = {
  title: "App/Sellers/SellerProceduresPage",
  component: SellerProceduresPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SellerProceduresPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
