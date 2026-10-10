import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { Field, Form, FormActions, Input, Notice, RadioGroup, SubmitButton } from "../form";
import { TextLink } from "../TextLink";
import { AuthScreen } from "./AuthScreen";

// フォーム送信のスタブ（Actions パネルに記録される）
const submitAction = fn(async () => {});

const loginForm = (
  <Form action={submitAction}>
    <Field label="メールアドレス" name="email" requirement="required">
      <Input placeholder="yamada@example.com" type="email" />
    </Field>
    <Field label="パスワード" name="password" requirement="required">
      <Input type="password" />
    </Field>
    <FormActions>
      <SubmitButton pendingLabel="ログイン中…">ログイン</SubmitButton>
    </FormActions>
    <FormActions layout="links">
      <TextLink href="/password-reset" variant="plain">
        パスワードをお忘れの方
      </TextLink>
      <TextLink href="/signup" variant="plain">
        新規登録はこちら
      </TextLink>
    </FormActions>
  </Form>
);

const signupForm = (
  <Form action={submitAction}>
    <Field
      description="感想口コミに表示される名前です。実名を避けることをおすすめします。"
      label="ハンドルネーム"
      name="handle"
      requirement="required"
    >
      <Input placeholder="トマト農家12年目" />
    </Field>
    <Field label="メールアドレス" name="email" requirement="required">
      <Input placeholder="yamada@example.com" type="email" />
    </Field>
    <Field
      description="8文字以上で、英字と数字を組み合わせてください。"
      label="パスワード"
      name="password"
      requirement="required"
    >
      <Input type="password" />
    </Field>
    <Field label="栽培形態" name="cultivation" requirement="optional">
      <RadioGroup
        defaultValue="greenhouse"
        options={[
          { value: "greenhouse", label: "施設栽培（ハウス・温室）" },
          { value: "openfield", label: "露地栽培" },
          { value: "both", label: "両方" },
        ]}
        variant="cards"
      />
    </Field>
    <Notice tone="warn">投稿は匿名です。プロフィールに実名や連絡先を書かないでください。</Notice>
    <FormActions>
      <SubmitButton pendingLabel="送信中…">登録する</SubmitButton>
    </FormActions>
    <FormActions layout="links">
      <TextLink href="/login" variant="plain">
        すでにアカウントをお持ちの方
      </TextLink>
    </FormActions>
  </Form>
);

const meta = {
  title: "Components/Auth/AuthScreen",
  component: AuthScreen,
  args: {
    title: "ログイン",
    children: loginForm,
  },
} satisfies Meta<typeof AuthScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Login: Story = {
  args: {
    lead: "感想口コミの投稿・参考になった・お気に入りの利用にはログインが必要です。",
  },
};

export const WithoutLead: Story = {};

export const SignUp: Story = {
  args: {
    title: "新規登録",
    lead: "メールアドレスとハンドルネームだけで登録できます。",
    children: signupForm,
  },
};

export const SubmitError: Story = {
  args: {
    lead: "感想口コミの投稿・参考になった・お気に入りの利用にはログインが必要です。",
    children: (
      <div>
        <Notice tone="error">メールアドレスまたはパスワードが正しくありません。</Notice>
        {loginForm}
      </div>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title: "企業会員の新規申請",
    lead: "会社と担当者を確認後、ログインIDとパスワード設定用の案内をお送りします。",
  },
};
