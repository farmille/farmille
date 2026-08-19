import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SignupForm } from "./SignupForm";

const meta = {
  title: "App/Auth/SignupForm",
  component: SignupForm,
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
