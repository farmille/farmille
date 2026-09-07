import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { PendingButton } from "./PendingButton";

/** Storybook 上で useFormStatus を成立させるためのダミー送信（実際には何もしない）。 */
async function noopSubmit() {}

/** 送信中の見た目を保持するため、意図的に解決しないダミー送信。 */
function pendingForever(): Promise<void> {
  return new Promise(() => {});
}

const meta = {
  title: "Components/PendingButton",
  component: PendingButton,
  args: {
    label: "保存する",
    pendingLabel: "保存中…",
  },
} satisfies Meta<typeof PendingButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  decorators: [
    (Story) => (
      <form action={noopSubmit}>
        <Story />
      </form>
    ),
  ],
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    label: "キャンセル",
    pendingLabel: "処理中…",
  },
  decorators: [
    (Story) => (
      <form action={noopSubmit}>
        <Story />
      </form>
    ),
  ],
};

export const Danger: Story = {
  args: {
    variant: "danger",
    label: "削除する",
    pendingLabel: "削除中…",
  },
  decorators: [
    (Story) => (
      <form action={noopSubmit}>
        <Story />
      </form>
    ),
  ],
};

export const Small: Story = {
  args: {
    size: "sm",
    label: "フォローする",
    pendingLabel: "処理中…",
  },
  decorators: [
    (Story) => (
      <form action={noopSubmit}>
        <Story />
      </form>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  decorators: [
    (Story) => (
      <form action={noopSubmit}>
        <Story />
      </form>
    ),
  ],
};

export const Pending: Story = {
  decorators: [
    (Story) => (
      <form action={pendingForever}>
        <Story />
      </form>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
  },
};
