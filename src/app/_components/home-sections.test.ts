import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { HomeFooter } from "./HomeFooter";
import { HomeInvitations } from "./HomeInvitations";

afterEach(cleanup);
describe("ホーム下部の導線", () => {
  it("一般登録とメーカー案内を分離する", () => {
    render(createElement(HomeInvitations, { showSignup: true }));
    expect(screen.getByRole("link", { name: "無料で会員登録" }).getAttribute("href")).toBe(
      "/signup/general",
    );
    expect(screen.getByRole("link", { name: "メーカー様はこちら" }).getAttribute("href")).toBe(
      "/sellers",
    );
    expect(screen.queryByRole("link", { name: "実証詳細レポートを投稿する" })).toBeNull();
    expect(screen.queryByRole("link", { name: "感想口コミを投稿する" })).toBeNull();
    expect(screen.queryByText(/農林水産省/)).toBeNull();
  });
  it("ログイン済みでは会員登録の勧誘を表示しない", () => {
    render(createElement(HomeInvitations, { showSignup: false }));
    expect(screen.queryByRole("link", { name: "無料で会員登録" })).toBeNull();
    expect(screen.getByRole("link", { name: "メーカー様はこちら" })).toBeTruthy();
  });
  it("フッターにダミーリンクを置かない", () => {
    render(createElement(HomeFooter));
    expect(screen.getByRole("link", { name: "企業会員登録の申請" }).getAttribute("href")).toBe(
      "/sellers/apply",
    );
    for (const link of screen.getAllByRole("link")) expect(link.getAttribute("href")).not.toBe("#");
    expect(screen.queryByRole("link", { name: /準備中/ })).toBeNull();
  });
});
