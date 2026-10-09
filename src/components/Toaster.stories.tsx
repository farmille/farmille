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
