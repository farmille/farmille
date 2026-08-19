import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  args: {
    placeholder: "使用した感想を記入してください（200文字以内）",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const Filled: Story = {
  args: {
    defaultValue:
      "定植前に土壌灌注で使用。うどんこ病の発生が例年より明らかに少なく、追肥との併用でも問題なかった。リピート予定。",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "審査中のため編集できません。",
  },
};
