import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReceiptButtons } from "./ReceiptButtons";
const meta = {
  title: "Pages/company-requests/ReceiptButtons",
  component: ReceiptButtons,
  parameters: { nextjs: { appDirectory: true } },
  args: { id: "11111111-1111-4111-8111-111111111111", sent: false },
} satisfies Meta<typeof ReceiptButtons>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
