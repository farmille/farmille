import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SellerPasswordResetForm } from "./SellerPasswordResetForm";
const meta = {
  title: "Pages/sellers/password-reset/SellerPasswordResetForm",
  component: SellerPasswordResetForm,
} satisfies Meta<typeof SellerPasswordResetForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
