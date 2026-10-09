import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import SellerApplyDonePage from "./page";

const meta = {
  title: "App/Sellers/SellerApplyDonePage",
  component: SellerApplyDonePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SellerApplyDonePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
