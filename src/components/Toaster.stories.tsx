import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { Button } from "./Button";
import { Toaster, toast } from "./Toaster";

const meta = {
  title: "Components/Feedback/Toaster",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openToast({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "通知を出す" }));
}

export const Message: Story = {
  render: () => (
    <>
      <Button size="sm" onClick={() => toast("感想口コミを投稿しました。")}>
        通知を出す
      </Button>
      <Toaster />
    </>
  ),
  play: openToast,
};

export const WithAction: Story = {
  render: () => (
    <>
      <Button
        size="sm"
        onClick={() =>
          toast("グラフを削除しました。", {
            duration: 6000,
            action: { label: "元に戻す", onClick: () => undefined },
          })
        }
      >
        通知を出す
      </Button>
      <Toaster />
    </>
  ),
  play: openToast,
};

export const AboveActionBar: Story = {
  render: () => (
    <>
      <Button
        size="sm"
        onClick={() => toast("下書きを保存しました。", { toasterId: "story-actions" })}
      >
        通知を出す
      </Button>
      <Toaster id="story-actions" label="画面の通知" placement="bottom" />
    </>
  ),
  play: openToast,
};

export const StatusIcons: Story = {
  render: () => (
    <>
      <Button onClick={() => toast.success("保存しました。", { duration: Infinity })}>
        成功通知を出す
      </Button>
      <Button onClick={() => toast.loading("処理中です。", { duration: Infinity })}>
        処理中の通知を出す
      </Button>
      <Toaster />
    </>
  ),
};
