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
  title: "Components/ToggleGroup",
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

/** 1つだけ押せる組（単位の候補など）。 */
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

/** 上限に達すると、押していない選択肢を押せなくする。 */
export const AtLimit: Story = {
  args: { limit: 2, value: ["樹勢改善", "収量増加"] },
};

export const Disabled: Story = {
  args: { disabled: true },
};
