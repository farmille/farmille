import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { expect, userEvent, within } from "storybook/test";
import { VerificationForm } from "./VerificationForm";
const meta = {
  title: "CompanyApplications/VerificationForm",
  component: VerificationForm,
  parameters: { nextjs: { appDirectory: true } },
  args: {},
  decorators: [(Story) => <div className={css({ p: "4" })}>{Story()}</div>],
} satisfies Meta<typeof VerificationForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Submitted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/^受付番号/), "12");
    await userEvent.type(canvas.getByLabelText(/^担当者メールアドレス/), "contact@example.test");
    await userEvent.click(canvas.getByRole("button", { name: "確認メールを送信" }));
    await expect(
      canvas.findByText("受付番号とメールアドレスが一致する場合は、確認メールをお送りしました。"),
    ).resolves.toBeVisible();
  },
};
