import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { AdminMfaForms } from "./MFAForms";

const meta = {
  title: "App/Admin/MfaForms",
  component: AdminMfaForms,
  args: {
    verifiedFactorId: null,
    next: "/admin",
  },
} satisfies Meta<typeof AdminMfaForms>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enrollment: Story = {};

export const Verification: Story = {
  args: { verifiedFactorId: "factor-storybook" },
};

// 認証アプリの6桁を入れた状態
export const VerificationCodeFilled: Story = {
  args: { verifiedFactorId: "factor-storybook" },
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByLabelText("認証コード"), "123456");
  },
};

// 6桁を送ってサーバーが受け付けなかった状態（Storybook の action は常にエラーを返す）
export const VerificationRejected: Story = {
  args: { verifiedFactorId: "factor-storybook" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("認証コード"), "123456");
    await userEvent.click(canvas.getByRole("button", { name: "2要素認証を完了する" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Storybook では認証コードを送信しません。",
    );
  },
};
