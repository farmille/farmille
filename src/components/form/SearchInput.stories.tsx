import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { SearchInput } from "./SearchInput";

const meta = {
  title: "Components/Form/SearchInput",
  component: SearchInput,
  args: {
    name: "q",
    placeholder: "資材名・メーカー名で検索",
    "aria-label": "資材名・メーカー名で検索",
    onValueChange: fn(),
  },
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 右端の送信ボタンで囲むフォームを送る。 */
export const WithSubmit: Story = {
  args: { submitLabel: "検索", defaultValue: "土づくり" },
};

/** 検索画面の上部に置く大きい検索欄。 */
export const Large: Story = {
  args: {
    size: "lg",
    placeholder: "作物・悩み・資材名を入力してください",
    "aria-label": "資材の検索条件",
  },
};

export const Focused: Story = {
  args: { submitLabel: "検索" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("searchbox"));
  },
};

export const Disabled: Story = {
  args: { submitLabel: "検索", disabled: true },
};
