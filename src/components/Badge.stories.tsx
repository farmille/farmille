import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./Badge";

const meta = {
  title: "Components/Display/Badge",
  component: Badge,
  args: {
    children: "資材ジャンル",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Type: Story = {
  args: {
    variant: "type",
    children: "微生物資材",
  },
};

export const Official: Story = {
  args: {
    variant: "official",
    children: "公式",
  },
};

export const Published: Story = {
  args: {
    variant: "published",
    children: "公開中",
  },
};

export const Draft: Story = {
  args: {
    variant: "draft",
    children: "下書き",
  },
};

export const Optional: Story = {
  args: {
    variant: "optional",
    children: "任意",
  },
};

export const Required: Story = {
  args: {
    variant: "required",
    children: "必須",
  },
};
