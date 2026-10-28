import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";

import { css } from "../../../styled-system/css";
import { signupAction } from "./actions";
import { RegistrationTerms } from "./RegistrationTerms";
import { SignupForm } from "./SignupForm";

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "Pages/signup/SignupForm",
  component: SignupForm,
  decorators: [fmDecorator],
  args: { email: "farmer@example.test", termsContent: <RegistrationTerms /> },
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 使用済みのニックネームで送信し、サーバーのエラーを受けて画面上部のニックネーム欄へ移動した状態。
export const HandleTaken: Story = {
  beforeEach: () => {
    mocked(signupAction).mockResolvedValue({
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors: { handle: "このニックネームはすでに使われています。" },
      values: { handle: "しおさい農園" },
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(canvas.getByLabelText(/^ニックネーム/), "しおさい農園");
    await userEvent.type(canvas.getByLabelText("本名（姓）"), "山田");
    await userEvent.type(canvas.getByLabelText("本名（名）"), "太郎");
    await userEvent.click(canvas.getByRole("radio", { name: "生産者" }));
    await userEvent.type(canvas.getByLabelText(/^郵便番号/), "3100011");
    await userEvent.click(canvas.getByRole("combobox", { name: /^都道府県/ }));
    await userEvent.click(await body.findByRole("option", { name: "茨城県" }));
    await userEvent.type(canvas.getByLabelText(/^市区町村・番地/), "水戸市三の丸1-1");
    const password = canvasElement.querySelector<HTMLInputElement>('input[name="password"]');
    if (password === null) throw new Error("パスワード欄が見つかりません。");
    await userEvent.type(password, "Farmille#Story2026");
    await userEvent.click(canvas.getByRole("checkbox", { name: /利用規約/ }));
    await userEvent.click(canvas.getByRole("button", { name: "登録する" }));
    await waitFor(() => expect(canvas.getByLabelText(/^ニックネーム/)).toHaveFocus());
  },
};
