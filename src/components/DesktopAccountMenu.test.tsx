import { fireEvent, render, screen } from "@testing-library/react";
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

  it("分割されたセッションCookieで会員メニューを表示する", () => {
    document.cookie = "sb-project-auth-token.0=session; path=/";
    render(<DesktopAccountMenu myPageCurrent={true} />);
    const trigger = screen.getByRole("button", { name: "アカウント" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const myPage = screen.getByRole("menuitem", { name: "マイページ" });
    expect(myPage.getAttribute("aria-current")).toBe("page");
    expect(document.activeElement).toBe(myPage);
    fireEvent.keyDown(myPage, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
