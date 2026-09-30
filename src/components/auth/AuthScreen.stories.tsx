import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { fn } from "storybook/test";

import { AuthScreen } from "./AuthScreen";
import {
  controlStyle,
  Field,
  formActionsStyle,
  FormMessage,
  linkRowStyle,
  NoteBox,
  RadioCards,
  SwitchToggle,
  textLinkStyle,
} from "./Fields";
import { SubmitButton } from "./SubmitButton";

// フォーム送信のスタブ（Actions パネルに記録される）
const submitAction = fn(async () => {});

const loginForm = (
  <form action={submitAction}>
    <Field htmlFor="login-email" label="メールアドレス" requirement="required">
      <input
        className={controlStyle}
        id="login-email"
        name="email"
        placeholder="yamada@example.com"
        type="email"
      />
    </Field>
    <Field htmlFor="login-password" label="パスワード" requirement="required">
      <input className={controlStyle} id="login-password" name="password" type="password" />
    </Field>
    <SwitchToggle defaultChecked label="次回から自動でログインする" name="remember" />
    <div className={formActionsStyle}>
      <SubmitButton label="ログイン" pendingLabel="ログイン中…" />
    </div>
    <div className={linkRowStyle}>
      <Link className={textLinkStyle} href="/password-reset">
        パスワードをお忘れの方
      </Link>
      <Link className={textLinkStyle} href="/signup">
        新規登録はこちら
      </Link>
    </div>
  </form>
);

const signupForm = (
  <form action={submitAction}>
    <Field
      guide="感想口コミに表示される名前です。実名を避けることをおすすめします。"
      htmlFor="signup-handle"
      label="ハンドルネーム"
      requirement="required"
    >
      <input
        className={controlStyle}
        id="signup-handle"
        name="handle"
        placeholder="トマト農家12年目"
        type="text"
      />
    </Field>
    <Field htmlFor="signup-email" label="メールアドレス" requirement="required">
      <input
        className={controlStyle}
        id="signup-email"
        name="email"
        placeholder="yamada@example.com"
        type="email"
      />
    </Field>
    <Field
      guide="8文字以上で、英字と数字を組み合わせてください。"
      htmlFor="signup-password"
      label="パスワード"
      requirement="required"
    >
      <input className={controlStyle} id="signup-password" name="password" type="password" />
    </Field>
    <Field label="栽培形態" requirement="optional">
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
    <NoteBox>投稿は匿名です。プロフィールに実名や連絡先を書かないでください。</NoteBox>
    <div className={formActionsStyle}>
      <SubmitButton label="登録する" pendingLabel="送信中…" />
    </div>
    <div className={linkRowStyle}>
      <Link className={textLinkStyle} href="/login">
        すでにアカウントをお持ちの方
      </Link>
    </div>
  </form>
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
        <FormMessage tone="error">メールアドレスまたはパスワードが正しくありません。</FormMessage>
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
