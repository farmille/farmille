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

export const WithDescription: Story = {
  args: {
    description:
      "パスキーを登録した方は、パスワードの代わりに、スマートフォンやパソコンの指紋や顔でログインできます。登録は、ログインした後にマイページでできます。",
  },
};
