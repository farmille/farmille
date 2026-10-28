import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";

import { Form, FormActions, Input, Notice, RadioGroup, SubmitButton } from "../form";
import { TextLink } from "../TextLink";
import { AuthScreen } from "./AuthScreen";

// フォーム送信のスタブ（Actions パネルに記録される）
const submitAction = fn(async () => {});

const loginForm = (
  <Form action={submitAction} persist={false}>
    <Input
      label="メールアドレス"
      name="email"
      placeholder="yamada@example.com"
      requirement="required"
      type="email"
    />
    <Input label="パスワード" name="password" requirement="required" type="password" />
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
  <Form action={submitAction} persist={false}>
    <Input
      description="感想口コミに表示される名前です。実名を避けることをおすすめします。"
      label="ニックネーム"
      name="handle"
      placeholder="トマト農家12年目"
      requirement="required"
    />
    <Input
      label="メールアドレス"
      name="email"
      placeholder="yamada@example.com"
      requirement="required"
      type="email"
    />
    <Input
      description="8文字以上で、英字と数字を組み合わせてください。"
      label="パスワード"
      name="password"
      requirement="required"
      type="password"
    />
    <RadioGroup
      defaultValue="greenhouse"
      label="栽培形態"
      name="cultivation"
      options={[
        { value: "greenhouse", label: "施設栽培（ハウス・温室）" },
        { value: "openfield", label: "露地栽培" },
        { value: "both", label: "両方" },
      ]}
      requirement="optional"
      variant="cards"
    />
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
  title: "Pages/Shared/AuthScreen",
  component: AuthScreen,
  parameters: { layout: "fullscreen" },
  args: {
    title: "ログイン",
    children: loginForm,
  },
} satisfies Meta<typeof AuthScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 上にほかの画面と同じ共通ヘッダーと準備中のお知らせを出し、その下に画面名を置く。 */
export const Login: Story = {
  args: {
    lead: "感想口コミの投稿・参考になった・お気に入りの利用にはログインが必要です。",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 共通ヘッダーは閲覧者を確かめてから描かれるので、出るのを待つ
    const [logo] = await canvas.findAllByRole("link", { name: "Farmille" });
    await expect(logo).toHaveAttribute("href", "/");
    const notice = canvas.getByRole("complementary", { name: "公開準備中のお知らせ" });
    const heading = canvas.getByRole("heading", { level: 1, name: "ログイン" });
    await expect(
      notice.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  },
};

export const LoginMobile: Story = {
  ...Login,
  globals: { viewport: { value: "mobile375", isRotated: false } },
};

export const LoginDesktop: Story = {
  ...Login,
  globals: { viewport: { value: "desktop1440", isRotated: false } },
};

/** 読み込み中の画面。閲覧者を確かめずに共通ヘッダーを出す。 */
export const Loading: Story = {
  args: { loading: true },
};

export const WithoutLead: Story = {};

export const SignUp: Story = {
  args: {
    title: "新規登録",
    lead: "メールアドレスとニックネームだけで登録できます。",
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
    lead: "会社と担当者を確認後、Farmille企業会員IDとパスワード設定用の案内をお送りします。",
  },
};
