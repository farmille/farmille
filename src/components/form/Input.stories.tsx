import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./Input";

const meta = {
  title: "Components/Form/Input",
  component: Input,
  args: {
    label: "作物名",
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
  args: { size: "sm", label: "写真の説明", placeholder: "写真の説明（任意）" },
};

export const WithGuidance: Story = {
  args: {
    label: "ニックネーム",
    name: "handle",
    requirement: "required",
    visibility: "public",
    lead: "投稿やマイページに表示されます。",
    description: "本名でなくて構いません。",
    placeholder: "農家の山田",
  },
};

export const HiddenLabel: Story = {
  args: { hideLabel: true, label: "写真の説明", placeholder: "写真の説明（任意）" },
};

export const Invalid: Story = {
  args: { error: "作物名を入力してください。", requirement: "required" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "ミニトマト" },
};

export const PasswordReveal: Story = {
  args: {
    label: "パスワード",
    defaultValue: "farmille-pass",
    placeholder: "••••••••",
    revealable: true,
    type: "password",
  },
};

export const ReadOnly: Story = {
  render: () => (
    <>
      <Input
        label="メールアドレス"
        name="email"
        readOnly
        type="email"
        value="farmer@example.test"
      />
      <Input defaultValue="農家の山田" label="ニックネーム" name="handle" />
    </>
  ),
};
