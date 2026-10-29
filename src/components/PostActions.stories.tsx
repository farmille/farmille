import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { PostActions } from "./PostActions";

const meta = {
  title: "Pages/Shared/PostActions",
  component: PostActions,
  args: {
    target: "review",
    id: "71000000-0000-4000-8000-000000000001",
    currentPath: "/",
    helpfulCount: 12,
    viewCount: 125,
    saved: false,
    voted: false,
  },
} satisfies Meta<typeof PostActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {};
export const Report: Story = { args: { target: "usage_report" } };

/**
 * 375px の画面で、文字を添えた「参考になった」「保存済み」「閲覧」が1行に並ぶ。
 * 「参考になった」は見た目を低くしたまま、上下 44px の範囲で押せる。
 */
export const Saved: Story = {
  args: { saved: true, voted: true },
  globals: { viewport: { value: "mobile375", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const helpful = canvas.getByRole("button", { name: /参考になった/ });
    const save = canvas.getByRole("button", { name: "保存済み" });
    const view = canvas.getByText("閲覧 125");
    const middles = [helpful, save, view].map((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    await expect(Math.max(...middles) - Math.min(...middles)).toBeLessThanOrEqual(2);
    await expect(save.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const helpfulRect = helpful.getBoundingClientRect();
    await expect(helpfulRect.height).toBeLessThan(44);
    const helpfulMiddle = helpfulRect.top + helpfulRect.height / 2;
    for (const y of [helpfulMiddle - 21, helpfulMiddle + 21]) {
      const hit = canvasElement.ownerDocument.elementFromPoint(
        helpfulRect.left + helpfulRect.width / 2,
        y,
      );
      await expect(hit?.closest("button")).toBe(helpful);
    }
  },
};
