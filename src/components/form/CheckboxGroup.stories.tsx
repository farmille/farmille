import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { CheckboxGroup } from "./CheckboxGroup";

const timings = [
  { value: "before", label: "栽培開始前" },
  { value: "planting", label: "播種・定植時" },
  { value: "growing", label: "生育期" },
  { value: "harvest", label: "収穫前後" },
];

const meta = {
  title: "Components/Form/CheckboxGroup",
  component: CheckboxGroup,
  args: {
    label: "使用時期",
    name: "timings",
    options: timings,
    defaultValue: ["planting"],
    onValueChange: fn(),
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const List: Story = {};

export const Chips: Story = {
  args: { variant: "chips" },
};

export const ChipsAtLimit: Story = {
  args: { variant: "chips", limit: 2, defaultValue: ["before", "growing"] },
};

export const InFieldset: Story = {
  args: { requirement: "required", variant: "chips" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
