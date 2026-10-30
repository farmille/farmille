import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import type { AuthFormState } from "@/lib/auth/form-state";

import { registrationEmailAction } from "./actions";
import { RegistrationEmailForm } from "./RegistrationEmailForm";

// ブラウザの形式検査は通り、サーバーの検証で弾かれるアドレス（ドメインに「.」がない）
const serverRejectedEmail = "farmer@localhost";

const linkError =
  "この認証リンクは、使用済みか、有効期限（1時間）が切れています。登録を済ませた方は、ログインしてください。";

const sent: AuthFormState = {
  status: "done",
  message:
    "farmer@example.testに認証メールを送信しました。メール内のリンクから登録情報を入力してください。",
};

async function sendEmail(): Promise<AuthFormState> {
  return sent;
}

const sendFailed = "認証メールを送信できませんでした。時間を置いて再度お試しください。";

async function failToSend(): Promise<AuthFormState> {
  return { status: "error", message: sendFailed };
}

// ブラウザの形式検査は通り、サーバーの長さの検証で弾かれるアドレス
const tooLongEmail = `${"a".repeat(64)}@${"b".repeat(200)}.example.test`;

// 前のテストの画面が外れるときに書いた入力の控えを、次のテストへ持ち越さない
beforeEach(() => {
  window.sessionStorage.clear();
});

describe("RegistrationEmailForm", () => {
  it("サーバーが返すメールアドレスの欄のエラーは、ブラウザの形式エラーと同じく欄の下にだけ出す", async () => {
    const user = userEvent.setup();
    render(<RegistrationEmailForm action={registrationEmailAction} />);
    const email = screen.getByLabelText(/^メールアドレス/);

    await user.click(email);
    await user.paste(tooLongEmail);
    await user.click(screen.getByRole("button", { name: "認証メールを送信" }));

    await waitFor(() =>
      expect(email).toHaveAccessibleDescription(/メールアドレスは254文字以内で入力してください。/),
    );
    // 読み上げで知らせるのは欄の下の文言だけで、上の帯は出さない
    expect(screen.getByRole("alert")).toHaveTextContent(
      "メールアドレスは254文字以内で入力してください。",
    );
    expect(screen.queryByText("入力内容を確認してください。")).not.toBeInTheDocument();
  });

  it("欄に結び付かないエラーは上の帯に出し、メールアドレスの欄を直すと消す", async () => {
    const user = userEvent.setup();
    render(<RegistrationEmailForm action={failToSend} />);
    const email = screen.getByLabelText(/^メールアドレス/);

    await user.type(email, "farmer@example.test");
    await user.click(screen.getByRole("button", { name: "認証メールを送信" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(sendFailed);

    await user.type(email, "p");
    expect(screen.queryByText(sendFailed)).not.toBeInTheDocument();
  });

  it("リンクを開けなかった案内にログイン画面へのリンクを添え、送信したら案内を消す", async () => {
    const user = userEvent.setup();
    render(
      <RegistrationEmailForm
        action={registrationEmailAction}
        error={linkError}
        next="/reports/sample"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(linkError);
    expect(screen.getByRole("link", { name: "ログイン画面へ" })).toHaveAttribute(
      "href",
      "/login?next=%2Freports%2Fsample",
    );

    await user.type(screen.getByLabelText(/^メールアドレス/), serverRejectedEmail);
    expect(screen.getByText(linkError)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "認証メールを送信" }));

    await waitFor(() =>
      expect(screen.getByLabelText(/^メールアドレス/)).toHaveAccessibleDescription(
        /メールアドレスの形式が正しくありません。/,
      ),
    );
    expect(screen.queryByText(linkError)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ログイン画面へ" })).not.toBeInTheDocument();
  });

  it("認証メールを送った後にメールアドレスの欄を直すと、送信済みの案内を消す", async () => {
    const user = userEvent.setup();
    render(<RegistrationEmailForm action={sendEmail} />);
    const email = screen.getByLabelText(/^メールアドレス/);

    await user.type(email, "farmer@example.test");
    await user.click(screen.getByRole("button", { name: "認証メールを送信" }));
    expect(await screen.findByText("メールをご確認ください")).toBeInTheDocument();

    await user.clear(email);
    await user.type(email, "farmer");
    await user.click(screen.getByRole("button", { name: "認証メールを再送" }));

    expect(email).toHaveAccessibleDescription(/メールアドレスの形式が正しくありません。/);
    expect(screen.queryByText("メールをご確認ください")).not.toBeInTheDocument();
  });

  it("認証メールの再送を始めたら、前回の送信済みの案内を消す", async () => {
    const user = userEvent.setup();
    let finishResend: (state: AuthFormState) => void = () => {};
    let sends = 0;

    async function sendThenWait(): Promise<AuthFormState> {
      sends += 1;

      if (sends === 1) return sent;

      return new Promise((resolve) => {
        finishResend = resolve;
      });
    }

    render(<RegistrationEmailForm action={sendThenWait} />);
    await user.type(screen.getByLabelText(/^メールアドレス/), "farmer@example.test");
    await user.click(screen.getByRole("button", { name: "認証メールを送信" }));
    expect(await screen.findByText("メールをご確認ください")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "認証メールを再送" }));

    expect(await screen.findByRole("button", { name: "送信中…" })).toBeInTheDocument();
    expect(screen.queryByText("メールをご確認ください")).not.toBeInTheDocument();

    finishResend({ ...sent });
    expect(await screen.findByText("メールをご確認ください")).toBeInTheDocument();
  });
});
