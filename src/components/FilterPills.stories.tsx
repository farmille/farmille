import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { FilterPills, type FilterPillOption } from "./FilterPills";

const CROP_OPTIONS: FilterPillOption[] = [
  { value: "all", label: "すべて" },
  { value: "tomato", label: "トマト" },
  { value: "cucumber", label: "キュウリ" },
  { value: "spinach", label: "ホウレンソウ" },
  { value: "rice", label: "水稲" },
];

const MANY_OPTIONS: FilterPillOption[] = [
  { value: "all", label: "すべて" },
  { value: "tomato", label: "トマト" },
  { value: "cucumber", label: "キュウリ" },
  { value: "spinach", label: "ホウレンソウ" },
  { value: "rice", label: "水稲" },
  { value: "strawberry", label: "イチゴ" },
  { value: "eggplant", label: "ナス" },
  { value: "onion", label: "タマネギ" },
  { value: "cabbage", label: "キャベツ" },
];

const meta = {
  title: "Components/FilterPills",
  component: FilterPills,
  args: {
    options: CROP_OPTIONS,
    value: "all",
    onChange: fn(),
  },
} satisfies Meta<typeof FilterPills>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    value: "tomato",
  },
};

export const ManyOptions: Story = {
  args: {
    options: MANY_OPTIONS,
    value: "cucumber",
  },
};

export const SingleOption: Story = {
  args: {
    options: [{ value: "all", label: "すべて" }],
    value: "all",
  },
};
