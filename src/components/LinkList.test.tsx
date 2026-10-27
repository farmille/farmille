import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LinkList } from "./LinkList";

afterEach(cleanup);

describe("LinkList", () => {
  it("見出しで区切った節に、行ごとのリンクを並べる", () => {
    render(
      <LinkList
        title="ログインとセキュリティ"
        items={[
          { href: "/account/password", label: "パスワードを変更" },
          { href: "/account/passkeys", label: "パスキーを管理" },
        ]}
      />,
    );
    const section = screen.getByRole("region", { name: "ログインとセキュリティ" });
    const links = within(section).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/account/password",
      "/account/passkeys",
    ]);
    expect(within(section).getByRole("link", { name: "パスワードを変更" })).toBeVisible();
  });

  it("行の状態を、リンクの中に添える", () => {
    render(
      <LinkList
        title="本人情報"
        items={[{ href: "/account/contact", label: "氏名・住所・電話", detail: "未登録" }]}
      />,
    );
    expect(screen.getByRole("link", { name: "氏名・住所・電話 未登録" })).toHaveAttribute(
      "href",
      "/account/contact",
    );
  });
});
