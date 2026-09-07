import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./Input";

const meta = {
  title: "Components/Input",
  component: Input,
  args: {
    placeholder: "資材名を入力",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: {
    defaultValue: "バチルス菌体資材 ツチイキル",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "水稲",
  },
};
