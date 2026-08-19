import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SellerLoginForm } from "./SellerLoginForm";

const meta = {
  title: "App/Sellers/SellerLoginForm",
  component: SellerLoginForm,
  args: { next: null },
} satisfies Meta<typeof SellerLoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithReturnPath: Story = {
  args: { next: "/dashboard" },
};
