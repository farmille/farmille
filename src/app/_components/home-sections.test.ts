import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { HomeFooter } from "./HomeFooter";
import { HomeInvitations } from "./HomeInvitations";
import { HomeFeedOrder } from "./HomeFeedOrder";

afterEach(cleanup);
describe("ホーム下部の導線", () => {
  it("一般登録とメーカー案内を分離する", () => {
    render(createElement(HomeInvitations, { showSignup: true }));
    expect(screen.getByRole("link", { name: "無料で会員登録" }).getAttribute("href")).toBe(
      "/signup/general",
    );
    expect(screen.getByRole("link", { name: "メーカー様はこちら →" }).getAttribute("href")).toBe(
      "/sellers",
    );
    expect(screen.getByRole("link", { name: "使用レポートを投稿する" }).getAttribute("href")).toBe(
      "/post?type=report",
    );
    expect(screen.queryByText(/農林水産省/)).toBeNull();
  });
  it("ログイン済みでは会員登録の勧誘を表示しない", () => {
    render(createElement(HomeInvitations, { showSignup: false }));
    expect(screen.queryByRole("link", { name: "無料で会員登録" })).toBeNull();
    expect(screen.getByRole("link", { name: "メーカー様はこちら →" })).toBeTruthy();
  });
  it("並び替えで他方の条件を維持する", () => {
    render(
      createElement(HomeFeedOrder, {
        target: "reviews",
        reportSort: "helpful",
        reviewSort: "helpful",
      }),
    );
    expect(screen.getByRole("link", { name: "新着順" }).getAttribute("href")).toBe(
      "/?reports=helpful&reviews=newest#home-reviews",
    );
    expect(
      screen
        .getByRole("link", { name: "直近1週間で参考になったが多い順" })
        .getAttribute("aria-current"),
    ).toBe("true");
  });
  it("フッターにダミーリンクを置かない", () => {
    render(createElement(HomeFooter));
    expect(screen.getByRole("link", { name: "メーカー登録申請" }).getAttribute("href")).toBe(
      "/sellers/apply",
    );
    for (const link of screen.getAllByRole("link")) expect(link.getAttribute("href")).not.toBe("#");
    expect(screen.queryByRole("link", { name: /準備中/ })).toBeNull();
  });
});
