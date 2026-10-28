import { describe, expect, it } from "vitest";

import { initialAuthFormState } from "@/lib/auth/form-state";

import { registrationEmailAction } from "./actions";

function emailForm(email: string): FormData {
  const formData = new FormData();
  formData.set("email", email);
  return formData;
}

describe("registrationEmailAction", () => {
  it("254文字を超えるメールアドレスは、メールアドレスの欄のエラーとして返す", async () => {
    const state = await registrationEmailAction(
      initialAuthFormState,
      emailForm(`${"a".repeat(5000)}@example.test`),
    );

    expect(state).toEqual({
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors: { email: "メールアドレスは254文字以内で入力してください。" },
    });
  });

  it("形式の誤ったメールアドレスは、メールアドレスの欄のエラーとして返す", async () => {
    const state = await registrationEmailAction(
      initialAuthFormState,
      emailForm("qa\u200b@example.test"),
    );

    expect(state).toMatchObject({
      status: "error",
      fieldErrors: { email: "メールアドレスの形式が正しくありません。" },
    });
  });
});
