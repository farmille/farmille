import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuthScreen } from "./AuthScreen";

afterEach(cleanup);

describe("AuthScreen", () => {
  it("ほかの画面と同じ共通ヘッダーと準備中のお知らせを、画面名の上に出す", () => {
    render(
      <AuthScreen loading title="ログイン">
        <p>フォーム</p>
      </AuthScreen>,
    );

    const logos = screen.getAllByRole("link", { name: "Farmille" });
    expect(logos.length).toBeGreaterThan(0);

    for (const logo of logos) expect(logo).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "メニュー" })).toBeInTheDocument();
    const notice = screen.getByRole("complementary", { name: "公開準備中のお知らせ" });
    const heading = screen.getByRole("heading", { level: 1, name: "ログイン" });
    expect(notice.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
