import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Form/Textarea",
  component: Textarea,
  args: {
    label: "コメント",
    placeholder: "気づいたことを自由に書いてください",
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: "lg" },
};

export const Filled: Story = {
  args: {
    defaultValue:
      "定植前に土壌灌注したところ、活着が早く、うどんこ病の広がりも例年より遅いと感じました。",
  },
};

export const Invalid: Story = {
  args: {
    error: "感想を入力してください。",
    label: "感想口コミ本文",
    requirement: "required",
    size: "lg",
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "送信済みの内容" },
};

export const WithExample: Story = {
  args: {
    label: "結果・感想",
    placeholder:
      "いつ頃から・どこに・どんな変化があったか。良くなかった点も\n例）2回目の使用から数日後、午後の葉の萎れが使用前よりやや軽くなった。",
  },
};
