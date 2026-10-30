import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as sellerLoginActions from "@/app/sellers/login/actions";
import { SellerLoginForm } from "@/app/sellers/login/SellerLoginForm";
import * as loginActions from "./actions";
import { LoginForm } from "./LoginForm";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe.each([
  {
    label: "一般会員",
    Component: LoginForm,
    mockAction: () => vi.spyOn(loginActions, "loginAction"),
    fieldName: "email",
    fieldLabel: "メールアドレス",
    identity: "farmer@example.test",
  },
  {
    label: "企業会員",
    Component: SellerLoginForm,
    mockAction: () => vi.spyOn(sellerLoginActions, "sellerLoginAction"),
    fieldName: "loginId",
    fieldLabel: "Farmille企業会員ID",
    identity: "test-manufacturer",
  },
])("$labelのログイン", ({ Component, mockAction, fieldName, fieldLabel, identity }) => {
  it("入力を送信し、認証エラー後は識別子を残してパスワードを消す", async () => {
    const action = mockAction().mockResolvedValue({
      status: "error",
      message: "ログインできませんでした。",
      values: { [fieldName]: identity },
    });
    render(
      <PathnameContext.Provider value="/login">
        <Component next="/me" />
      </PathnameContext.Provider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: fieldLabel }), {
      target: { value: identity },
    });
    fireEvent.change(screen.getByLabelText("パスワード"), {
      target: { value: "test-password" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ログインする" }));
    });

    expect(await screen.findByText("ログインできませんでした。")).toBeVisible();
    const call = action.mock.lastCall;
    if (call === undefined) throw new Error("ログイン処理が呼ばれていません。");
    expect(call[1].get(fieldName)).toBe(identity);
    expect(call[1].get("password")).toBe("test-password");
    expect(call[1].get("next")).toBe("/me");
    expect(screen.getByRole("textbox", { name: fieldLabel })).toHaveValue(identity);
    expect(screen.getByLabelText("パスワード")).toHaveValue("");
  });
});
