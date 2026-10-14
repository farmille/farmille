import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PasskeyLogin } from "./PasskeyLogin";

const meta = {
  title: "Pages/Shared/PasskeyLogin",
  component: PasskeyLogin,
  args: { next: null },
} satisfies Meta<typeof PasskeyLogin>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
