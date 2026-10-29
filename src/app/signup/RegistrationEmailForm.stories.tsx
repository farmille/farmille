import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { registrationEmailAction } from "./actions";
import { RegistrationEmailForm } from "./RegistrationEmailForm";
const meta = {
  title: "Pages/signup/RegistrationEmailForm",
  component: RegistrationEmailForm,
  args: { action: registrationEmailAction },
} satisfies Meta<typeof RegistrationEmailForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const UsedLink: Story = {
  args: {
    error:
      "この認証リンクは、使用済みか、有効期限（1時間）が切れています。登録を済ませた方は、ログインしてください。登録がまだの方は、いちばん新しい認証メールのリンクを開くか、下の欄から認証メールを受け取り直してください。",
  },
};
