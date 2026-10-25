import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { css } from "../../../styled-system/css";
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

export const WithSubmit: Story = {
  args: { submitLabel: "検索", defaultValue: "土づくり" },
};

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

const forestBackdrop = css({ p: "4", bg: "surface.forest" });

export const Raised: Story = {
  args: {
    size: "lg",
    surface: "raised",
    submitLabel: "検索",
    placeholder: "作物・悩み・資材名から探す",
    "aria-label": "資材を検索する。作物、悩み、資材名から探せます",
  },
  decorators: [
    (Story) => (
      <div className={forestBackdrop}>
        <Story />
      </div>
    ),
  ],
};
