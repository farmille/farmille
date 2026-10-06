import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { controlStyle, Field, FormMessage, HintBox, NoteBox, RadioCards } from "./Fields";

const meta = {
  title: "Components/Auth/Fields",
  component: Field,
  args: {
    label: "メールアドレス",
    htmlFor: "email",
    children: (
      <input
        className={controlStyle}
        id="email"
        name="email"
        placeholder="yamada@example.com"
        type="email"
      />
    ),
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    requirement: "required",
  },
};

export const Optional: Story = {
  args: {
    label: "ハンドルネーム",
    htmlFor: "handle",
    requirement: "optional",
    children: (
      <input
        className={controlStyle}
        id="handle"
        name="handle"
        placeholder="トマト農家12年目"
        type="text"
      />
    ),
  },
};

export const WithGuide: Story = {
  args: {
    requirement: "required",
    guide: "確認メールを受け取れるアドレスを入力してください。",
  },
};

export const WithError: Story = {
  args: {
    requirement: "required",
    error: "メールアドレスの形式が正しくありません。",
  },
};

// 以下はこのファイルが export する補助コンポーネントのストーリー（Field の args は使わない）

export const RadioCardsSelected: Story = {
  render: () => (
    <Field label="栽培形態" requirement="required">
      <RadioCards
        defaultValue="greenhouse"
        name="cultivation"
        options={[
          { value: "greenhouse", label: "施設栽培（ハウス・温室）" },
          { value: "openfield", label: "露地栽培" },
          { value: "both", label: "両方" },
        ]}
      />
    </Field>
  ),
};

export const RadioCardsUnselected: Story = {
  render: () => (
    <Field label="栽培形態" requirement="required">
      <RadioCards
        name="cultivation"
        options={[
          { value: "greenhouse", label: "施設栽培（ハウス・温室）" },
          { value: "openfield", label: "露地栽培" },
          { value: "both", label: "両方" },
        ]}
      />
    </Field>
  ),
};

export const Note: Story = {
  render: () => (
    <NoteBox>会社と担当者を確認後、ログインIDとパスワード設定用の案内をお送りします。</NoteBox>
  ),
};

export const Hint: Story = {
  render: () => (
    <HintBox>ハンドルネームは後から変更できます。実名を避けることをおすすめします。</HintBox>
  ),
};

export const FormMessageError: Story = {
  render: () => (
    <FormMessage tone="error">メールアドレスまたはパスワードが正しくありません。</FormMessage>
  ),
};

export const FormMessageInfo: Story = {
  render: () => (
    <FormMessage tone="info">
      確認メールを送信しました。メール内のリンクから登録を完了してください。
    </FormMessage>
  ),
};

export const Public: Story = { args: { visibility: "public" } };
