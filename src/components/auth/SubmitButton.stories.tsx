import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { SubmitButton } from "./SubmitButton";

// useFormStatus を使うため、各ストーリーで <form> にラップして描画する
const submitAction = fn(async () => {});
// 送信中状態を再現するため、解決しない Promise を返すスタブ
const pendingAction = fn(() => new Promise<void>(() => {}));

const meta = {
  title: "Components/Auth/SubmitButton",
  component: SubmitButton,
  args: {
    label: "ログイン",
    pendingLabel: "ログイン中…",
  },
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <form action={submitAction}>
        <Story />
      </form>
    ),
  ],
};

export const Register: Story = {
  args: {
    label: "登録する",
    pendingLabel: "送信中…",
  },
  decorators: [
    (Story) => (
      <form action={submitAction}>
        <Story />
      </form>
    ),
  ],
};

// 送信ボタンを押した直後の送信中状態（pendingLabel 表示＋disabled）
export const Pending: Story = {
  decorators: [
    (Story) => (
      <form action={pendingAction}>
        <Story />
      </form>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "ログイン" }));
  },
};
