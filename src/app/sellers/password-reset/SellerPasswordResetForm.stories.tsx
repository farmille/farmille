import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SellerPasswordResetForm } from "./SellerPasswordResetForm";
const meta = {
  title: "App/Auth/SellerPasswordResetForm",
  component: SellerPasswordResetForm,
} satisfies Meta<typeof SellerPasswordResetForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
