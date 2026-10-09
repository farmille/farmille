import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field } from "./Field";
import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Form/Textarea",
  component: Textarea,
  args: {
    "aria-label": "コメント",
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
  render: (args) => (
    <Field error="感想を入力してください。" label="感想口コミ本文" requirement="required">
      <Textarea {...args} aria-label={undefined} size="lg" />
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "送信済みの内容" },
};
