import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Field } from "./Field";
import { Form } from "./Form";
import { FormActions } from "./FormActions";
import { Input } from "./Input";
import { Notice } from "./Notice";
import { Select } from "./Select";
import { SubmitButton } from "./SubmitButton";

/** Storybook 上で送信しても画面を移らないためのダミー送信。 */
async function noopSubmit() {}

const prefectures = [
  { value: "08", label: "茨城県" },
  { value: "13", label: "東京都" },
];

const meta = {
  title: "Components/Form/Form",
  component: Form,
  args: {
    action: noopSubmit,
    children: (
      <>
        <Field label="メールアドレス" name="email" requirement="required" visibility="private">
          <Input autoComplete="email" placeholder="you@example.com" type="email" />
        </Field>
        <Field label="都道府県" name="prefectureCode" requirement="required">
          <Select options={prefectures} placeholder="選択してください" />
        </Field>
        <FormActions>
          <SubmitButton pendingLabel="登録中…">登録する</SubmitButton>
        </FormActions>
      </>
    ),
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 送信すると、未入力の必須項目にエラーを出して最初の項目へフォーカスを移す。 */
export const Default: Story = {};

export const ServerErrors: Story = {
  args: {
    errors: {
      email: "このメールアドレスはすでに登録されています。",
      prefectureCode: "都道府県を選んでください。",
    },
    children: (
      <>
        <Notice tone="error">入力内容を確認してください。</Notice>
        <Field label="メールアドレス" name="email" requirement="required" visibility="private">
          <Input defaultValue="yamada@example.com" type="email" />
        </Field>
        <Field label="都道府県" name="prefectureCode" requirement="required">
          <Select options={prefectures} placeholder="選択してください" />
        </Field>
        <FormActions>
          <SubmitButton pendingLabel="登録中…">登録する</SubmitButton>
        </FormActions>
      </>
    ),
  },
};
