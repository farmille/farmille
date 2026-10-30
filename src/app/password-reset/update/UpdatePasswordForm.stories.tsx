import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

const meta = {
  title: "Pages/password-reset/update/UpdatePasswordForm",
  component: UpdatePasswordForm,
  args: { tokenHash: "storybook-token-not-valid-for-authentication" },
} satisfies Meta<typeof UpdatePasswordForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CodeFilled: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByLabelText("2要素認証コード"), "123456");
  },
};
