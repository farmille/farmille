import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer, type FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Form } from "./Form";
import { Input } from "./Input";

function ControlledEmail() {
  const [email, setEmail] = useReducer((_current: string, next: string) => next, "");

  return (
    <>
      <Input
        label="メールアドレス"
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        value={email}
      />
      <output>{email}</output>
    </>
  );
}

describe("Input", () => {
  it("目のボタンでパスワードの表示と非表示を切り替える", async () => {
    const user = userEvent.setup();
    render(
      <Input
        defaultValue="farmille-pass"
        hideLabel
        label="パスワード"
        revealable
        type="password"
      />,
    );

    const field = screen.getByLabelText("パスワード");
    expect(field).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "パスワードを表示する" }));
    expect(field).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "パスワードを隠す" }));
    expect(field).toHaveAttribute("type", "password");
  });

  it("メールアドレスの欄から離れると、全角の英数字と記号を半角にする", async () => {
    const user = userEvent.setup();
    render(<Input label="メールアドレス" type="email" />);

    const field = screen.getByRole("textbox", { name: "メールアドレス" });
    await user.type(field, "ｑａ＠ｅｘａｍｐｌｅ．ｔｅｓｔ");
    await user.tab();

    expect(field).toHaveValue("qa@example.test");
  });

  it("メールアドレスに貼り付けで混じった見えない文字と前後の空白を除く", async () => {
    const user = userEvent.setup();
    render(<Input label="メールアドレス" type="email" />);

    const field = screen.getByRole("textbox", { name: "メールアドレス" });
    await user.click(field);
    await user.paste("\u3000qa\u200B@exam\u200Dple.test\uFEFF ");
    await user.tab();

    expect(field).toHaveValue("qa@example.test");
  });

  it("画面の state で値を持つメールアドレスの欄も、整えた値を state に渡す", async () => {
    const user = userEvent.setup();
    render(<ControlledEmail />);

    await user.type(
      screen.getByRole("textbox", { name: "メールアドレス" }),
      "ｑａ＠ｅｘａｍｐｌｅ．ｔｅｓｔ",
    );
    await user.tab();

    expect(screen.getByRole("status")).toHaveTextContent(/^qa@example\.test$/);
  });

  it("電話番号の欄から離れると、全角の数字・ハイフン・空白を半角にして欄に出す", async () => {
    const user = userEvent.setup();
    render(<Input label="電話番号" type="tel" />);

    const field = screen.getByRole("textbox", { name: "電話番号" });
    await user.type(field, "＋８１\u3000９０ー１２３４－５６７８");
    expect(field).toHaveValue("＋８１\u3000９０ー１２３４－５６７８");
    await user.tab();

    expect(field).toHaveValue("+81 90-1234-5678");
  });

  it("長すぎるメールアドレスも途中で切らずに残し、長さはサーバーの検証で知らせる", async () => {
    const user = userEvent.setup();
    const tooLong = `${"a".repeat(5000)}@example.test`;
    render(<Input label="メールアドレス" type="email" />);

    const field = screen.getByRole("textbox", { name: "メールアドレス" });
    await user.click(field);
    await user.paste(tooLong);
    await user.tab();

    expect(field).toHaveValue(tooLong);
  });

  it("メールアドレスの形式が合わないときは、直し方を添えて知らせる", async () => {
    const user = userEvent.setup();
    render(
      <Form persist={false} onSubmit={(event: FormEvent) => event.preventDefault()}>
        <Input label="メールアドレス" name="email" type="email" />
        <Input label="ウェブサイト" name="website" type="url" />
        <button type="submit">送信</button>
      </Form>,
    );

    await user.type(screen.getByRole("textbox", { name: "メールアドレス" }), "farmer.example.test");
    await user.type(screen.getByRole("textbox", { name: "ウェブサイト" }), "farmille");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(screen.getByRole("textbox", { name: "メールアドレス" })).toHaveAccessibleDescription(
      "メールアドレスの形式が正しくありません。半角英数字で、「@」を含めて入力してください。",
    );
    expect(screen.getByRole("textbox", { name: "ウェブサイト" })).toHaveAccessibleDescription(
      "入力の形式が正しくありません。",
    );
  });

  it("欄を離れたときの確認は、空欄では行わず、確かめている間に入力し直したら古い値の結果を出さない", async () => {
    const user = userEvent.setup();
    const checked: string[] = [];

    let answer: (message: string | null) => void = () => {
      throw new Error("確認が始まっていません。");
    };

    render(
      <Input
        check={(value) => {
          checked.push(value);

          return new Promise((resolve) => {
            answer = resolve;
          });
        }}
        label="ニックネーム"
        name="handle"
      />,
    );
    const field = screen.getByLabelText("ニックネーム");

    await user.click(field);
    await user.tab();
    expect(checked).toEqual([]);

    await user.type(field, "せっかち農家");
    await user.tab();
    await user.type(field, "2");
    await act(async () => answer("このニックネームはすでに使われています。"));

    expect(checked).toEqual(["せっかち農家"]);
    expect(screen.queryByText("このニックネームはすでに使われています。")).not.toBeInTheDocument();
  });
});
