import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { SubmitButton } from "./SubmitButton";

/** 送信中の見た目を保持するため、意図的に解決しないダミー送信。 */
function pendingForever(): Promise<void> {
  return new Promise(() => {});
}

const meta = {
  title: "Components/Form/SubmitButton",
  component: SubmitButton,
  args: {
    children: "登録する",
    pendingLabel: "登録中…",
  },
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Ghost: Story = {
  args: { variant: "ghost", children: "下書きを保存", pendingLabel: "保存中…" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "削除する", pendingLabel: "削除中…" },
};

export const Small: Story = {
  args: { size: "sm", children: "更新", pendingLabel: "更新中…" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** 画面側で送信中を渡す（ダイアログの確定など）。 */
export const PendingProp: Story = {
  args: { pending: true },
};

/** フォームの送信中は押したボタンにフォーカスを残したまま文言を切り替える。 */
export const PendingFormStatus: Story = {
  decorators: [
    (Story) => (
      <form action={pendingForever}>
        <Story />
      </form>
    ),
  ],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
  },
};
