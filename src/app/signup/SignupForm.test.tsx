import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { SignupForm } from "./SignupForm";

const HANDLE_TAKEN = "このニックネームはすでに使われています。別のニックネームを入力してください。";

async function handleIsFree(): Promise<string | null> {
  return null;
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("SignupForm", () => {
  it("フォームが初期値へ戻されても、入力したパスワードを残す", async () => {
    const user = userEvent.setup();
    render(
      <SignupForm
        checkHandle={handleIsFree}
        email="farmer@example.test"
        termsContent={<p>利用規約</p>}
      />,
    );
    const handle = screen.getByLabelText(/^ニックネーム/);
    const password = screen.getByLabelText(/^パスワード/, { selector: "input" });
    await user.type(handle, "農家の山田");
    await user.type(password, "farmille-pass");

    // サーバーの検証で戻ったあと、React は送信したフォームをこの操作で初期値へ戻す
    const form = password.closest("form");
    if (form === null) throw new Error("パスワード欄がフォームの中にありません。");
    form.reset();

    expect(handle).toHaveValue("");
    expect(password).toHaveValue("farmille-pass");
  });

  it("ニックネームの欄を離れた時点で使われていれば欄の下に出し、入力し直すと消す", async () => {
    const user = userEvent.setup();
    const checked: string[] = [];
    render(
      <SignupForm
        checkHandle={async (value) => {
          checked.push(value);
          return value === "せっかち農家" ? HANDLE_TAKEN : null;
        }}
        email="farmer@example.test"
        termsContent={<p>利用規約</p>}
      />,
    );
    const handle = screen.getByLabelText(/^ニックネーム/);

    await user.type(handle, "せっかち農家");
    await user.tab();

    await waitFor(() => expect(handle).toHaveAccessibleDescription(new RegExp(HANDLE_TAKEN)));
    expect(checked).toEqual(["せっかち農家"]);

    await user.type(handle, "2");
    expect(screen.queryByText(HANDLE_TAKEN)).not.toBeInTheDocument();
  });

  it("「登録する」を1回押すと、空白・形式・未選択・文字数の誤りを欄ごとにまとめて出し、最初の誤りの欄へ移る", async () => {
    const user = userEvent.setup();
    render(
      <SignupForm
        checkHandle={handleIsFree}
        email="farmer@example.test"
        termsContent={<p>利用規約</p>}
      />,
    );
    const handle = screen.getByLabelText(/^ニックネーム/);
    await user.type(handle, "   ");
    await user.type(screen.getByLabelText("本名（姓）"), "　");
    await user.type(screen.getByLabelText("本名（名）"), "太郎");
    await user.type(screen.getByLabelText(/^郵便番号/), "abc");
    await user.type(screen.getByLabelText(/^パスワード/, { selector: "input" }), "12345");

    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(handle).toHaveAccessibleDescription(/ニックネームを入力してください。/);
    expect(screen.getByLabelText("本名（姓）")).toHaveAccessibleDescription(
      /姓を入力してください。/,
    );
    expect(screen.getByLabelText(/^郵便番号/)).toHaveAccessibleDescription(
      /郵便番号を7桁で入力してください。/,
    );
    expect(screen.getByText("都道府県を選択してください。")).toBeInTheDocument();
    expect(screen.getByLabelText(/^パスワード/, { selector: "input" })).toHaveAccessibleDescription(
      /パスワードは8文字以上で入力してください。/,
    );
    expect(screen.getByText("あなたの属性を選択してください。")).toBeInTheDocument();
    expect(
      screen.getByText("利用規約・プライバシーポリシーへの同意が必要です。"),
    ).toBeInTheDocument();
    expect(handle).toHaveFocus();

    await user.clear(screen.getByLabelText(/^郵便番号/));
    await user.type(screen.getByLabelText(/^郵便番号/), "100-0001");
    expect(screen.queryByText("郵便番号を7桁で入力してください。")).not.toBeInTheDocument();
  });

  it("電話番号の欄を離れると、全角の数字とハイフンを半角に直して欄に出す", async () => {
    const user = userEvent.setup();
    render(
      <SignupForm
        checkHandle={handleIsFree}
        email="farmer@example.test"
        termsContent={<p>利用規約</p>}
      />,
    );
    const phone = screen.getByRole("textbox", { name: /^電話番号/ });

    await user.type(phone, "０９０－１２３４－５６７８");
    await user.tab();

    expect(phone).toHaveValue("090-1234-5678");
  });
});
