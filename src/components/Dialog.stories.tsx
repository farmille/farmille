import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { css } from "../../styled-system/css";
import { Button } from "./Button";
import { Dialog, DialogActions, DialogClose } from "./Dialog";

const meta = {
  title: "Components/Dialog/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <p className={css({ mt: "3", textStyle: "supporting" })}>
    通報内容は運営だけが確認します。投稿者に通報者が知らされることはありません。
  </p>
);

export const Closed: Story = {
  args: {
    title: "この感想口コミを通報する",
    trigger: <Button variant="ghost">通報する</Button>,
    children: body,
  },
};

export const Panel: Story = {
  args: {
    title: "この感想口コミを通報する",
    description: "不適切な内容を見つけた場合にお知らせください。",
    trigger: <Button variant="ghost">通報する</Button>,
    children: (
      <>
        {body}
        <DialogActions>
          <DialogClose>キャンセル</DialogClose>
          <DialogClose variant="primary">通報する</DialogClose>
        </DialogActions>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "通報する" }));
  },
};

export const Controlled: Story = {
  args: {
    title: "通報を受け付けました",
    description: "内容を確認のうえ対応いたします。ご協力ありがとうございます。",
    open: true,
    onOpenChange: fn(),
    children: (
      <DialogActions>
        <DialogClose>閉じる</DialogClose>
      </DialogActions>
    ),
  },
};

export const Fullscreen: Story = {
  args: {
    title: "公開後の見え方",
    size: "fullscreen",
    closeLabel: "プレビューに戻る",
    open: true,
    onOpenChange: fn(),
    children: (
      <div className={css({ px: "4", py: "4" })}>
        <h1 className={css({ fontSize: "2xl" })}>土壌改良材A 実証詳細レポート｜トマト</h1>
        {body}
      </div>
    ),
  },
};

export const Sheet: Story = {
  args: {
    title: "使用目的を選ぶ",
    size: "sheet",
    open: true,
    onOpenChange: fn(),
    footer: <DialogClose variant="primary">完了</DialogClose>,
    children: (
      <div className={css({ display: "grid", gap: "3" })}>
        {body}
        {body}
      </div>
    ),
  },
};

export const SheetWide: Story = {
  args: { ...Sheet.args, title: "施用時期を選ぶ", wide: true, fit: true },
};
