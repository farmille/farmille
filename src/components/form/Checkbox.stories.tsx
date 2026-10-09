import Link from "next/link";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "./Checkbox";
import { Field } from "./Field";

const meta = {
  title: "Components/Form/Checkbox",
  component: Checkbox,
  args: {
    children: "市区町村も表示する",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const InlineChecked: Story = {
  args: { defaultChecked: true },
};

export const WithDescription: Story = {
  args: {
    defaultChecked: true,
    description: "都道府県に加えて、プロフィールに市区町村が表示されます。",
  },
};

/** 同意欄。ラベルの無い Field に置くと、必須の札が行末に出る。 */
export const TermsRow: Story = {
  render: (args) => (
    <Field name="terms" requirement="required">
      <Checkbox {...args} variant="row">
        <Link href="/legal/terms" rel="noopener noreferrer" target="_blank">
          総合利用規約
        </Link>
        ・
        <Link href="/legal/posting" rel="noopener noreferrer" target="_blank">
          投稿ガイドライン
        </Link>
        に同意する
      </Checkbox>
    </Field>
  ),
};

export const TermsRowChecked: Story = {
  render: (args) => (
    <Field name="terms" requirement="required">
      <Checkbox {...args} defaultChecked variant="row">
        総合利用規約・投稿ガイドラインに同意する
      </Checkbox>
    </Field>
  ),
};

export const Invalid: Story = {
  render: (args) => (
    <Field error="利用規約への同意が必要です。" name="terms" requirement="required">
      <Checkbox {...args} variant="row">
        総合利用規約・投稿ガイドラインに同意する
      </Checkbox>
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
};
