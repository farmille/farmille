import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field } from "./Field";
import { Input } from "./Input";

const meta = {
  title: "Components/Form/Input",
  component: Input,
  args: {
    "aria-label": "作物名",
    placeholder: "トマト",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: "ミニトマト" },
};

export const Small: Story = {
  args: { size: "sm", "aria-label": "写真の説明", placeholder: "写真の説明（任意）" },
};

export const Invalid: Story = {
  render: (args) => (
    <Field error="作物名を入力してください。" label="作物名" requirement="required">
      <Input {...args} aria-label={undefined} />
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "ミニトマト" },
};

export const PasswordReveal: Story = {
  args: {
    "aria-label": "パスワード",
    defaultValue: "farmille-pass",
    placeholder: "••••••••",
    revealable: true,
    type: "password",
  },
};

export const ReadOnly: Story = {
  render: () => (
    <>
      <Field label="メールアドレス" name="email">
        <Input name="email" readOnly type="email" value="farmer@example.test" />
      </Field>
      <Field label="ニックネーム" name="handle">
        <Input defaultValue="農家の山田" name="handle" />
      </Field>
    </>
  ),
};
