import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./Input";
import { Labeled } from "./Labeled";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Components/Form/Labeled",
  component: Labeled,
  args: {
    labeling: { label: "ニックネーム", requirement: "required", visibility: "public" },
    name: "handle",
    children: <Input label={null} placeholder="農家の山田" />,
  },
} satisfies Meta<typeof Labeled>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HiddenLabel: Story = {
  args: { labeling: { label: "姓", hideLabel: true }, name: "familyName" },
};

export const Group: Story = {
  args: {
    kind: "group",
    labeling: { label: "あなたの立場", requirement: "required" },
    name: "standpoint",
    children: (
      <RadioGroup
        label={null}
        options={[
          { value: "farmer", label: "生産者" },
          { value: "advisor", label: "指導員" },
        ]}
      />
    ),
  },
};
