import Link from "next/link";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "./Checkbox";
import { Field } from "./Field";

const meta = {
  title: "Components/Form/Checkbox",
  component: Checkbox,
  args: {
    children: "メールでお知らせを受け取る",
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
    description: "必要な連絡だけを送ります。",
  },
};

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

export const NoteRow: Story = {
  render: (args) => (
    <Field name="pesticideAck" requirement="required">
      <Checkbox {...args} variant="note">
        実際に使用した感想を、使用条件や感じた変化が分かるよう具体的にご記入ください。農薬として登録されていない資材については、農薬としての効果を断定せず、実際に感じた変化としてご記載ください。投稿の前に
        <Link href="/legal/posting">感想口コミガイドライン</Link>をご確認ください。
      </Checkbox>
    </Field>
  ),
};

export const DangerSmall: Story = {
  args: { children: "この写真を削除する", size: "sm", tone: "danger" },
};
