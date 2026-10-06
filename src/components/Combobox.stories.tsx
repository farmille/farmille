import { fn } from "storybook/test";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Combobox } from "./Combobox";

const options = [
  { value: "tomato", label: "トマト", description: "なす科果菜類" },
  { value: "strawberry", label: "いちご", description: "野菜類" },
  { value: "cucumber", label: "きゅうり", description: "うり類" },
];
const meta = {
  title: "Components/Combobox",
  component: Combobox,
  args: {
    id: "crop-combobox",
    "aria-label": "作目",
    placeholder: "作物名を入力",
    value: "",
    options,
    onValueChange: fn(),
    onSelect: fn(),
  },
  render: function ComboboxStory(args) {
    const [value, setValue] = useState(args.value);
    return (
      <Combobox
        {...args}
        value={value}
        onValueChange={setValue}
        onSelect={(id) => setValue(options.find((option) => option.value === id)?.label ?? id)}
        options={args.options.filter((option) => option.label.includes(value))}
      />
    );
  },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NoMatches: Story = { args: { value: "りんご" } };
export const Disabled: Story = { args: { disabled: true } };
