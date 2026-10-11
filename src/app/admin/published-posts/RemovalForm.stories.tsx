import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, within } from "storybook/test";

import { removePublishedPostAction } from "./actions";
import { RemovalForm } from "./RemovalForm";

const meta = {
  title: "App/Admin/PublishedPosts/RemovalForm",
  component: RemovalForm,
  args: { id: "00000000-0000-4000-8000-000000000401", type: "review" },
} satisfies Meta<typeof RemovalForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {};
export const UsageReport: Story = { args: { type: "usage_report" } };

async function expand(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "公開から削除する" }));
  return canvas;
}

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    await expand(canvasElement);
  },
};

export const ConfirmationMissing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await expand(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "非公開にする" }));
    await expect(await canvas.findByText("この項目は必須です。")).toBeVisible();
    await expect(canvas.getByRole("checkbox")).not.toBeChecked();
    await expect(removePublishedPostAction).not.toHaveBeenCalled();
  },
};

export const Removed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await expand(canvasElement);
    await userEvent.click(canvas.getByRole("checkbox"));
    await userEvent.click(canvas.getByRole("button", { name: "非公開にする" }));
    await expect(
      await canvas.findByText("公開から削除しました。投稿内容は運営の記録として保持されています。"),
    ).toBeVisible();
    const call = mocked(removePublishedPostAction).mock.lastCall;
    if (call === undefined) throw new Error("removePublishedPostAction が呼ばれていません");
    await expect(Object.fromEntries(call[1])).toEqual({
      id: "00000000-0000-4000-8000-000000000401",
      type: "review",
      confirmed: "on",
    });
  },
};
