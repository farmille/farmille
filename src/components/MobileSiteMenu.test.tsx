import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MobileSiteMenu } from "./MobileSiteMenu";

const links = [
  { label: "資材をさがす", href: "/search", current: true },
  { label: "記事", href: "/articles", current: false },
];

afterEach(cleanup);

describe("MobileSiteMenu", () => {
  it("開くと PC と同じサイトメニューと、未ログインならログインと新規登録を出す", async () => {
    render(<MobileSiteMenu links={links} member={false} />);
    fireEvent.click(screen.getByRole("button", { name: "メニュー" }));
    const current = await screen.findByRole("link", { name: "資材をさがす" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "ログイン" }).getAttribute("href")).toBe("/login");
    expect(screen.queryByRole("button", { name: "ログアウト" })).toBeNull();
  });

  it("会員にはアカウントの項目を出し、リンクを押すと閉じる", async () => {
    render(<MobileSiteMenu links={links} member />);
    fireEvent.click(screen.getByRole("button", { name: "メニュー" }));
    expect(await screen.findByRole("button", { name: "ログアウト" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "ログイン" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "記事" }));
    expect(screen.getByRole("button", { name: "メニュー" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("会員か未判定のときは、開いた時点のログインの cookie で項目を決める", async () => {
    render(<MobileSiteMenu links={links} />);
    fireEvent.click(screen.getByRole("button", { name: "メニュー" }));
    expect(await screen.findByRole("link", { name: "ログイン" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "メニューを閉じる" }));
    document.cookie = "sb-local-auth-token=1";
    try {
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "メニュー" }).getAttribute("aria-expanded")).toBe(
          "false",
        ),
      );
      fireEvent.click(screen.getByRole("button", { name: "メニュー" }));
      expect(await screen.findByRole("button", { name: "ログアウト" })).toBeTruthy();
    } finally {
      document.cookie = "sb-local-auth-token=; max-age=0";
    }
  });
});
