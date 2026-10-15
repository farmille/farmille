import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FileInput } from "./FileInput";

const meta = {
  title: "Components/Form/FileInput",
  component: FileInput,
  args: {
    accept: "image/jpeg,image/png,image/webp",
    label: "画像ファイル",
  },
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { multiple: true },
};

export const InField: Story = {
  args: {
    description: "PDF・JPEG・PNG（10MBまで）",
    label: "確認資料",
    name: "evidence",
    requirement: "required",
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
