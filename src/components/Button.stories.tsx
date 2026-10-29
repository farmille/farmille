import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { css } from "../../styled-system/css";
import { Button } from "./Button";

const meta = {
  title: "Components/Actions/Button",
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

export const FocusableWhenDisabled: Story = {
  args: {
    disabled: true,
    focusableWhenDisabled: true,
    children: "送信中…",
  },
};

/** 読み込み中は押せず、文字の幅を保ったまま回る印を出す。読み上げでは名前を変えずに処理中を伝える。 */
export const Loading: Story = {
  args: { loading: true, children: "閉じる", onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "閉じる" });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** 読み込み中と通常のボタンを並べ、幅が変わらないことを確かめる。 */
export const LoadingKeepsWidth: Story = {
  render: () => (
    <div className={css({ display: "grid", gap: "2", justifyItems: "start" })}>
      <Button size="sm">チュートリアルを閉じる</Button>
      <Button size="sm" loading>
        チュートリアルを閉じる
      </Button>
      <Button size="sm" variant="ghost">
        チュートリアルを閉じる
      </Button>
      <Button size="sm" variant="ghost" loading>
        チュートリアルを閉じる
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [idle, loading, idleGhost, loadingGhost] = within(canvasElement).getAllByRole("button");
    await expect(loading.getBoundingClientRect().width).toBe(idle.getBoundingClientRect().width);
    await expect(loadingGhost.getBoundingClientRect().width).toBe(
      idleGhost.getBoundingClientRect().width,
    );
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
