import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReceiptSprig } from "./ReceiptSprig";
import { css } from "../../../../styled-system/css";
const meta = {
  title: "Pages/company-requests/ReceiptSprig",
  component: ReceiptSprig,
  args: { className: css({ w: "40" }) },
} satisfies Meta<typeof ReceiptSprig>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
