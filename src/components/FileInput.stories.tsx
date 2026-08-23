import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FileInput } from "./FileInput";

const meta = {
  title: "Components/FileInput",
  component: FileInput,
  args: {
    accept: "image/jpeg,image/png,image/webp",
    "aria-label": "画像ファイル",
  },
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { multiple: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
