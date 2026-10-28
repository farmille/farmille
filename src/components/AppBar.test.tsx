import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppBar } from "./AppBar";

afterEach(cleanup);

describe("AppBar のサイトメニュー", () => {
  it("未ログインと一般会員には「投稿する」を出す", () => {
    render(<AppBar account={{ kind: "guest" }} chrome="public" variant="home" />);
    expect(screen.getByRole("link", { name: "投稿する" }).getAttribute("href")).toBe("/post");
    cleanup();
    render(
      <AppBar
        account={{ kind: "member", avatar: null, canPost: true }}
        chrome="public"
        variant="home"
      />,
    );
    expect(screen.getByRole("link", { name: "投稿する" })).toBeTruthy();
    expect(document.querySelector("[data-can-post]")).toBeNull();
  });

  it("投稿できない企業会員には「投稿する」を出さない", () => {
    render(
      <AppBar
        account={{ kind: "member", avatar: null, canPost: false }}
        chrome="public"
        variant="home"
      />,
    );
    expect(screen.queryByRole("link", { name: "投稿する" })).toBeNull();
    expect(screen.getByRole("link", { name: "記事" })).toBeTruthy();
    // ルートレイアウトのフッターは、この目印で投稿のリンクを隠す
    expect(document.querySelector('[data-can-post="false"]')).not.toBeNull();
  });
});
