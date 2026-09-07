import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select } from "./Select";

const meta = {
  title: "Components/Select",
  component: Select,
  args: {
    children: (
      <>
        <option value="">作物を選択してください</option>
        <option value="tomato">トマト（施設）</option>
        <option value="cucumber">キュウリ</option>
        <option value="spinach">ホウレンソウ</option>
        <option value="rice">水稲</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    defaultValue: "tomato",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "tomato",
  },
};
