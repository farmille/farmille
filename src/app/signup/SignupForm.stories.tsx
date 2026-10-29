import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { css } from "../../../styled-system/css";
import { registrationHandleCheckAction } from "./actions";
import { RegistrationTerms } from "./RegistrationTerms";
import { SignupForm } from "./SignupForm";

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const HANDLE_TAKEN = "このニックネームはすでに使われています。別のニックネームを入力してください。";

const meta = {
  title: "Pages/signup/SignupForm",
  component: SignupForm,
  decorators: [fmDecorator],
  args: {
    email: "farmer@example.test",
    termsContent: <RegistrationTerms />,
    checkHandle: registrationHandleCheckAction,
  },
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** ニックネームの欄を離れた時点で、使われていることを欄の下に出す。 */
export const HandleTaken: Story = {
  args: { checkHandle: async () => HANDLE_TAKEN },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 規約の全文は非同期のサーバーコンポーネントなので、フォームが描かれるのを待つ
    await userEvent.type(await canvas.findByLabelText(/^ニックネーム/), "せっかち農家");
    await userEvent.tab();
    await expect(await canvas.findByText(HANDLE_TAKEN)).toBeVisible();
  },
};

/** 電話番号の欄を離れた時点で、全角の数字とハイフンを半角に直して欄に出す。 */
export const PhoneFullWidth: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const phone = await canvas.findByRole("textbox", { name: /^電話番号/ });
    await userEvent.type(phone, "０９０－１２３４－５６７８");
    await userEvent.tab();
    await expect(phone).toHaveValue("090-1234-5678");
  },
};

/** 空白だけ・形式の誤り・未選択・文字数不足を、1回の「登録する」でまとめて出し、最初の誤りの欄へ移る。 */
export const AllErrorsAtOnce: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText(/^ニックネーム/), "   ");
    await userEvent.type(canvas.getByLabelText("本名（姓）"), "　");
    await userEvent.type(canvas.getByLabelText(/^郵便番号/), "abc");
    await userEvent.type(canvas.getByLabelText(/^パスワード/, { selector: "input" }), "12345");
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await expect(await canvas.findByText("ニックネームを入力してください。")).toBeVisible();
    await expect(canvas.getByText("姓を入力してください。")).toBeVisible();
    await expect(canvas.getByText("郵便番号を7桁で入力してください。")).toBeVisible();
    await expect(canvas.getByText("都道府県を選択してください。")).toBeVisible();
    await expect(canvas.getByText("パスワードは8文字以上で入力してください。")).toBeVisible();
    await waitFor(() => expect(canvas.getByLabelText(/^ニックネーム/)).toHaveFocus());
  },
};
