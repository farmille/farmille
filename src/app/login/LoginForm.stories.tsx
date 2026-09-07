import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LoginForm } from "./LoginForm";

const meta = {
  title: "App/Auth/LoginForm",
  component: LoginForm,
  args: { next: null },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithReturnPath: Story = {
  args: { next: "/me/saved" },
};
