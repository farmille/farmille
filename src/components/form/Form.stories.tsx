import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Form } from "./Form";
import { FormActions } from "./FormActions";
import { Input } from "./Input";
import { Notice } from "./Notice";
import { Select } from "./Select";
import { SubmitButton } from "./SubmitButton";

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
    persist: false,
    children: (
      <>
        <Input
          autoComplete="email"
          label="メールアドレス"
          name="email"
          placeholder="you@example.com"
          requirement="required"
          type="email"
          visibility="private"
        />
        <Select
          label="都道府県"
          name="prefectureCode"
          options={prefectures}
          placeholder="選択してください"
          requirement="required"
        />
        <FormActions>
          <SubmitButton pendingLabel="登録中…">登録する</SubmitButton>
        </FormActions>
      </>
    ),
  },
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

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
        <Input
          defaultValue="yamada@example.com"
          label="メールアドレス"
          name="email"
          requirement="required"
          type="email"
          visibility="private"
        />
        <Select
          label="都道府県"
          name="prefectureCode"
          options={prefectures}
          placeholder="選択してください"
          requirement="required"
        />
        <FormActions>
          <SubmitButton pendingLabel="登録中…">登録する</SubmitButton>
        </FormActions>
      </>
    ),
  },
};
