import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./Button";

const meta = {
  title: "Components/Button",
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
