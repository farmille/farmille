import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { Button } from "./Button";
import { Toaster, toast } from "./Toaster";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openToast({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "通知を出す" }));
}

// 文言だけの通知
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

// 取り消し操作を持つ通知
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

// 下端に操作バーを固定した画面が自分で置く出口。toasterId を付けた通知だけがここに出る
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
