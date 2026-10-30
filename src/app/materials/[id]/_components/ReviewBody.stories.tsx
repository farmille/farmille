import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { css } from "../../../../../styled-system/css";

import { ReviewBody } from "./ReviewBody";

const longBody = Array.from(
  { length: 12 },
  (_, index) =>
    `${index + 1}週目：定植後から2週間おきに灌水と合わせて使いました。葉の色と根張りを観察しています。`,
).join("\n");

const meta = {
  title: "Pages/materials/[id]/ReviewBody",
  component: ReviewBody,
  decorators: [(Story) => <div className={css({ maxW: "phone" })}>{Story()}</div>],
  args: { children: "ハウストマトで2週間おきに葉面散布しました。新しい葉の色がよくなりました。" },
} satisfies Meta<typeof ReviewBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Short: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};

export const Long: Story = {
  args: { children: longBody },
};

export const LongExpanded: Story = {
  args: { children: longBody },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "続きを読む" }));
    await expect(canvas.getByRole("button", { name: "閉じる" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};
