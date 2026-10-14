import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChangePasswordForm } from "./ChangePasswordForm";
const meta = {
  title: "Pages/account/password/ChangePasswordForm",
  component: ChangePasswordForm,
  args: { loginHref: "/login", resetHref: "/password-reset" },
} satisfies Meta<typeof ChangePasswordForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Manufacturer: Story = {
  args: { loginHref: "/sellers/login", resetHref: "/sellers/password-reset" },
};
