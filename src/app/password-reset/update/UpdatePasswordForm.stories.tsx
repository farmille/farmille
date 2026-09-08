import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

const meta = {
  title: "App/Auth/UpdatePasswordForm",
  component: UpdatePasswordForm,
  args: { tokenHash: "storybook-token-not-valid-for-authentication" },
} satisfies Meta<typeof UpdatePasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
