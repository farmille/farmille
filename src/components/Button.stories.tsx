import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "保存する",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "キャンセル",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "削除する",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "フォローする",
  },
};

export const SmallGhost: Story = {
  args: {
    variant: "ghost",
    size: "sm",
    children: "すべて見る",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "送信中…",
  },
};

/** 短いラベルと横並び時の幅を確認する。 */
export const ShortLabels: Story = {
  render: () => (
    <div className={css({ display: "grid", gap: "4" })}>
      <div className={css({ display: "flex", gap: "2", flexWrap: "wrap" })}>
        <Button size="sm">保存</Button>
        <Button size="sm" variant="ghost">
          戻る
        </Button>
        <Button size="sm" variant="danger">
          削除
        </Button>
      </div>
      <div className={css({ display: "flex", gap: "2" })}>
        <Button variant="ghost">キャンセル</Button>
        <Button>保存する</Button>
      </div>
    </div>
  ),
};

export const LongLabels: Story = {
  render: () => (
    <div className={css({ display: "grid", gap: "4", maxW: "content.form" })}>
      <Button size="sm">確認を完了してログインを発行</Button>
      <Button variant="ghost">アカウントをお持ちの方はログイン</Button>
      <Button>入力した内容を確認して実証詳細レポートを投稿する</Button>
    </div>
  ),
};
