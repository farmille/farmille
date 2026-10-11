import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { Field } from "./Field";
import { Select } from "./Select";

const crops = [
  { value: "tomato", label: "トマト（施設）" },
  { value: "cucumber", label: "キュウリ" },
  { value: "spinach", label: "ホウレンソウ" },
  { value: "rice", label: "水稲" },
];

const groupedCrops = [
  { value: "tomato", label: "トマト", description: "なす科果菜類", group: "果菜類" },
  { value: "eggplant", label: "ナス", description: "なす科果菜類", group: "果菜類" },
  { value: "spinach", label: "ホウレンソウ", description: "ひゆ科葉菜類", group: "葉菜類" },
  { value: "rice", label: "水稲", description: "いね科", disabled: true },
];

const meta = {
  title: "Components/Form/Select",
  component: Select,
  args: {
    "aria-label": "作物",
    options: crops,
    placeholder: "作物を選択してください",
    onValueChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openSelect({ canvasElement }: { canvasElement: HTMLElement }) {
  await userEvent.click(within(canvasElement).getByRole("combobox"));
}

export const Default: Story = {};

export const Selected: Story = {
  args: { defaultValue: "tomato" },
};

export const Compact: Story = {
  args: {
    "aria-label": "並び替え",
    size: "sm",
    defaultValue: "reviews",
    options: [
      { value: "reviews", label: "感想口コミが多い順" },
      { value: "rating", label: "★が高い順" },
      { value: "newest", label: "新着順" },
    ],
  },
};

export const Open: Story = {
  args: { defaultValue: "cucumber" },
  play: openSelect,
};

export const GroupsAndDescriptions: Story = {
  args: { options: groupedCrops },
  play: openSelect,
};

export const Invalid: Story = {
  render: (args) => (
    <Field error="作物を選んでください。" label="作物" requirement="required">
      <Select {...args} aria-label={undefined} />
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "tomato" },
};
