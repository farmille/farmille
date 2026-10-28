import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteFooter } from "./SiteFooter";

afterEach(cleanup);

describe("SiteFooter", () => {
  it("規約とプライバシーポリシーへのリンクを置く", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "プライバシーポリシー" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
    expect(screen.getByRole("link", { name: "規約・ガイドライン" })).toHaveAttribute(
      "href",
      "/legal",
    );
  });

  it("未ログインの閲覧者には、参加の一覧に会員登録を出す", () => {
    render(<SiteFooter />);

    expect(
      within(screen.getByRole("navigation", { name: "参加する" })).getByRole("link", {
        name: "新規会員登録",
      }),
    ).toHaveAttribute("href", "/signup/general");
  });
});
