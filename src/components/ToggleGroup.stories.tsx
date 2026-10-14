import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type ComponentProps } from "react";
import { fn } from "storybook/test";

import { ToggleGroup } from "./ToggleGroup";

const purposes = [
  { value: "樹勢改善", label: "樹勢改善" },
  { value: "発根促進", label: "発根促進" },
  { value: "収量増加", label: "収量増加" },
  { value: "品質向上", label: "品質向上" },
  { value: "病害の抑制", label: "病害の抑制" },
  { value: "土壌改良", label: "土壌改良" },
];

function StatefulToggleGroup(args: ComponentProps<typeof ToggleGroup>) {
  const [value, setValue] = useState<readonly string[]>(args.value);
  return (
    <ToggleGroup
      {...args}
      onValueChange={(next) => {
        setValue(next);
        args.onValueChange(next);
      }}
      value={value}
    />
  );
}

const meta = {
  title: "Components/Actions/ToggleGroup",
  component: ToggleGroup,
  args: {
    "aria-label": "使用目的",
    options: purposes,
    value: ["樹勢改善"],
    multiple: true,
    onValueChange: fn(),
  },
  render: (args) => <StatefulToggleGroup {...args} />,
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Multiple: Story = {};

export const Single: Story = {
  args: {
    "aria-label": "単位の候補",
    multiple: false,
    options: [
      { value: "%", label: "%" },
      { value: "kg/10a", label: "kg/10a" },
      { value: "本", label: "本" },
      { value: "cm", label: "cm" },
    ],
    value: ["kg/10a"],
  },
};

export const AtLimit: Story = {
  args: { limit: 2, value: ["樹勢改善", "収量増加"] },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Timeline: Story = {
  args: {
    "aria-label": "施用時期の段階",
    variant: "timeline",
    options: [
      "栽培開始前",
      "播種・定植時",
      "播種・定植直後",
      "生育初〜中期",
      "開花・生殖成長開始期",
      "着果・生育中期",
      "生育後期〜収穫前",
      "収穫後",
    ].map((label, index) => ({ value: String(index), label })),
    value: ["1", "3"],
  },
};
