import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilterPills, type FilterPillOption } from "./FilterPills";

const CROPS = [
  ["all", "すべて"],
  ["tomato", "トマト"],
  ["cucumber", "キュウリ"],
  ["spinach", "ホウレンソウ"],
  ["rice", "水稲"],
  ["strawberry", "イチゴ"],
  ["eggplant", "ナス"],
  ["onion", "タマネギ"],
  ["cabbage", "キャベツ"],
] as const;

function items(count: number, current: string): FilterPillOption[] {
  return CROPS.slice(0, count).map(([value, label]) => ({
    href: value === "all" ? "/articles" : `/articles?crop=${value}`,
    label,
    current: value === current,
  }));
}

const meta = {
  title: "Components/FilterPills",
  component: FilterPills,
  args: {
    "aria-label": "作物で絞り込む",
    items: items(5, "all"),
  },
} satisfies Meta<typeof FilterPills>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { items: items(5, "tomato") },
};

export const ManyOptions: Story = {
  args: { items: items(9, "cucumber") },
};

export const SingleOption: Story = {
  args: { items: items(1, "all") },
};
