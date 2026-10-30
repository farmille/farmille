import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
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

export const Retried: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "控えメールを再送" }));
    await expect(canvas.findByText("メールの送信状況を確認しました。")).resolves.toBeVisible();
  },
};
