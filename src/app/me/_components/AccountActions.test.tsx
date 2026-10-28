import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountActions } from "./AccountActions";

function actionNames() {
  return screen
    .getAllByRole("link")
    .map((link) => link.textContent)
    .concat(screen.getAllByRole("button").map((button) => button.textContent));
}

describe("マイページ下部のアカウント操作", () => {
  it("一般会員には登録情報の確認・変更を置き、退会を並びの最後に置く", () => {
    render(<AccountActions />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["登録情報を確認・変更", "/account/details"],
      ["パスキーを管理", "/account/passkeys"],
      ["パスワードを変更", "/account/password"],
      ["企業会員登録を申請", "/sellers?from=me"],
      ["退会する", "/account/withdraw"],
    ]);
    expect(screen.getByRole("button", { name: "ログアウト" })).toBeInTheDocument();
  });

  it("運営のアカウントには登録情報と退会を出さない", () => {
    render(<AccountActions admin />);
    expect(actionNames()).not.toContain("登録情報を確認・変更");
    expect(actionNames()).not.toContain("退会する");
  });
});
