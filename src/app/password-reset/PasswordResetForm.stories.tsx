import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PasswordResetForm } from "./PasswordResetForm";

const meta = {
  title: "App/Auth/PasswordResetForm",
  component: PasswordResetForm,
} satisfies Meta<typeof PasswordResetForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
