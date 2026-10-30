import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DesktopAccountMenu } from "./DesktopAccountMenu";

afterEach(() => {
  for (const cookie of document.cookie.split(";")) {
    document.cookie = `${cookie.split("=")[0]?.trim()}=; Max-Age=0; path=/`;
  }
});

describe("DesktopAccountMenu", () => {
  it("パスワード再設定用のCookieだけでは会員メニューを表示しない", () => {
    document.cookie = "sb-project-auth-token-code-verifier=verifier; path=/";
    render(<DesktopAccountMenu myPageCurrent={false} />);
    fireEvent.click(screen.getByRole("button", { name: "アカウント" }));
    expect(screen.getByRole("menuitem", { name: "ログイン" })).toBeDefined();
    expect(screen.queryByRole("menuitem", { name: "ログアウト" })).toBeNull();
  });

  it("分割されたセッションCookieで会員メニューを表示する", async () => {
    document.cookie = "sb-project-auth-token.0=session; path=/";
    render(<DesktopAccountMenu myPageCurrent={true} />);
    const trigger = screen.getByRole("button", { name: "アカウント" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const myPage = screen.getByRole("menuitem", { name: "マイページ" });
    expect(myPage.getAttribute("aria-current")).toBe("page");
    await waitFor(() => expect(document.activeElement).toBe(myPage));
    fireEvent.keyDown(myPage, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("ログアウトは /logout への POST フォームで送る", () => {
    document.cookie = "sb-project-auth-token=session; path=/";
    render(<DesktopAccountMenu myPageCurrent={false} />);
    fireEvent.click(screen.getByRole("button", { name: "アカウント" }));
    const logout = screen.getByRole("menuitem", { name: "ログアウト" });

    if (!(logout instanceof HTMLButtonElement))
      throw new Error("ログアウトが送信ボタンではありません。");
    expect(logout.type).toBe("submit");
    expect(logout.form?.getAttribute("action")).toBe("/logout");
    expect(logout.form?.getAttribute("method")).toBe("post");
  });

  it("サーバーが会員と確かめた閲覧者には、cookie が無くても会員の項目を出す", () => {
    render(
      <DesktopAccountMenu myPageCurrent={false} member={{ avatar: <i data-testid="avatar" /> }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "アカウント" }));
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "マイページ" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "ログアウト" })).toBeDefined();
    expect(screen.queryByRole("menuitem", { name: "ログイン" })).toBeNull();
  });
});
