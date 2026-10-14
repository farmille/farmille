import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ReceiptAccessPage from "./page";

const meta = {
  title: "Pages/company-requests/receipts/ReceiptAccessPage",
  component: ReceiptAccessPage,
} satisfies Meta<typeof ReceiptAccessPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
