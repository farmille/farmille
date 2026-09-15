import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    title: "感想口コミを削除しますか？",
    description: "削除した感想口コミと写真は元に戻せません。",
    confirmLabel: "削除する",
    triggerLabel: "削除",
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// トリガーのみ表示（ダイアログは閉じた状態）
export const Closed: Story = {};

// play でダイアログを開いた状態（onConfirm 版：確認ボタンは通常の button）
export const Opened: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "削除" }));
  },
};

// action（form submit 版）でダイアログを開いた状態
export const OpenedWithFormAction: Story = {
  args: {
    action: fn((_formData: FormData) => undefined).mockName("deleteAction"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "削除" }));
  },
};

// 前向きな操作（primary）の確認ダイアログ
export const PrimaryConfirm: Story = {
  args: {
    title: "記事を公開しますか？",
    description: "公開すると資材ページの記事一覧にすぐ表示されます。",
    confirmLabel: "公開する",
    cancelLabel: "あとで",
    confirmVariant: "primary",
    triggerLabel: "公開",
    triggerVariant: "primary",
    triggerSize: "md",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "公開" }));
  },
};

// 控えめな導線（ghost トリガー）から危険操作を確認する場合
export const GhostTrigger: Story = {
  args: {
    triggerVariant: "ghost",
  },
};

// トリガーが無効化された状態
export const TriggerDisabled: Story = {
  args: {
    triggerDisabled: true,
  },
};
