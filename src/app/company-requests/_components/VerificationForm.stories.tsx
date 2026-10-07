import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { formalPageRecipe } from "./formal-styles";
import { expect, userEvent, within } from "storybook/test";
import { VerificationForm } from "./VerificationForm";
const meta = {
  title: "CompanyApplications/VerificationForm",
  component: VerificationForm,
  parameters: { nextjs: { appDirectory: true } },
  args: {},
  decorators: [
    (Story) => (
      <div className="fm">
        <div className={css({ p: "4" })}>
          <div className={formalPageRecipe()}>{Story()}</div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof VerificationForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Submitted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/^法人名/), "農業資材株式会社");
    await userEvent.type(canvas.getByLabelText(/^担当者名/), "山田太郎");
    await userEvent.type(canvas.getByLabelText(/^担当者メールアドレス/), "contact@example.test");
    await userEvent.click(canvas.getByRole("button", { name: "送信して申請フォームを受け取る" }));
    await expect(
      canvas.findByRole("heading", { name: "申請フォームのURLをお送りしました" }),
    ).resolves.toBeVisible();
  },
};

export const ReceiptAccess: Story = { args: { receipt: true } };
