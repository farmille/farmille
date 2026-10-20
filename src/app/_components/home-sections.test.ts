import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { HomeConcept } from "./HomeConcept";
import { HomeFooter } from "./HomeFooter";
import { HomeLetters, supportLetters } from "./HomeLetters";
import { HomeSellerInvitation } from "./HomeSellerInvitation";

afterEach(cleanup);
describe("ホームの導線", () => {
  it("未ログインではコンセプトの下に会員登録だけを置き、投稿の導線は出さない", () => {
    render(createElement(HomeConcept, { showSignup: true }));
    expect(screen.getByRole("link", { name: "無料で会員登録" }).getAttribute("href")).toBe(
      "/signup/general",
    );
    expect(screen.queryByRole("link", { name: "実証詳細レポートを投稿する" })).toBeNull();
    expect(screen.queryByRole("link", { name: "感想口コミを投稿する" })).toBeNull();
  });
  it("ログイン済みでは会員登録の勧誘を表示しない", () => {
    render(createElement(HomeConcept, { showSignup: false }));
    expect(screen.queryByRole("link", { name: "無料で会員登録" })).toBeNull();
  });
  it("メーカー案内は一般の会員登録と分け、掲載の流れへ案内する", () => {
    render(createElement(HomeSellerInvitation));
    expect(screen.getByRole("link", { name: "メーカー様はこちら" }).getAttribute("href")).toBe(
      "/sellers",
    );
    expect(screen.queryByRole("link", { name: "無料で会員登録" })).toBeNull();
    expect(screen.queryByText(/農林水産省/)).toBeNull();
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

describe("応援メッセージ", () => {
  it("全文を開かずに読め、差出人は肩書きだけを添える", () => {
    render(createElement(HomeLetters));
    const letters = screen.getAllByRole("figure");
    expect(letters).toHaveLength(supportLetters.length);
    letters.forEach((letter, index) => {
      const { role, paragraphs } = supportLetters[index];
      for (const text of paragraphs) expect(within(letter).getByText(text)).toBeTruthy();
      expect(within(letter).getByText(role)).toBeTruthy();
    });
    expect(screen.queryByRole("button")).toBeNull();
  });
});
