import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SellerApplyForm } from "./SellerApplyForm";

const meta = {
  title: "App/Sellers/SellerApplyForm",
  component: SellerApplyForm,
} satisfies Meta<typeof SellerApplyForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
