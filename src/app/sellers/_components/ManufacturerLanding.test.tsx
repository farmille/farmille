import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManufacturerLanding } from "./ManufacturerLanding";

describe("企業向け利用ガイド", () => {
  it("登録の戻り先を保持し、4種の申請と実在する編集・連絡先へ案内する", () => {
    render(<ManufacturerLanding applyHref="/sellers/apply?from=me" />);
    expect(screen.getByRole("link", { name: "申請フォームへ進む" })).toHaveAttribute(
      "href",
      "/sellers/apply?from=me",
    );
    const members = screen.getByRole("region", { name: "企業会員登録済みの方の活用ガイド" });
    const links = within(members).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/dashboard/applications/new/registration",
      "/dashboard/materials",
      "/dashboard/applications/new/registration",
      "/company-requests/removal",
      "/dashboard/applications/new/transfer_out",
      "/dashboard/applications/new/transfer_in",
      "/dashboard/profile",
      "/dashboard/applications",
    ]);
    const faq = screen.getByRole("region", { name: "よくあるご質問" });
    expect(within(faq).getAllByRole("heading", { level: 3 })).toHaveLength(9);
    for (const target of within(faq).getAllByRole("link")) {
      const href = target.getAttribute("href");
      expect(href).toMatch(/^#/);
      expect(document.querySelector(href ?? "")).not.toBeNull();
    }
    expect(document.querySelector('a[href="/company-requests/removal/form"]')).toBeNull();
    const contents = screen.getByRole("navigation", { name: "利用ガイドの目次" });
    expect(within(contents).getAllByRole("link")).toHaveLength(5);
    for (const link of within(contents).getAllByRole("link")) {
      const target = link.getAttribute("href");
      expect(target).toMatch(/^#/);
      if (!target) throw new Error("目次にリンク先がありません");
      expect(document.getElementById(target.slice(1))).not.toBeNull();
    }
  });
});
