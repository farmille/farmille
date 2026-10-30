import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManufacturerLanding } from "./ManufacturerLanding";

describe("企業向け利用ガイド", () => {
  it("登録の戻り先を保持し、3種の申請フォームと実在する編集・連絡先へ案内し、終売・非公開はメールで受け付ける", () => {
    render(<ManufacturerLanding applyHref="/sellers/apply?from=me" />);
    expect(screen.getByRole("link", { name: "申請フォームへ進む" })).toHaveAttribute(
      "href",
      "/sellers/apply?from=me",
    );
    const faq = screen.getByRole("region", { name: "よくあるご質問" });

    for (const target of within(faq).getAllByRole("link")) {
      const href = target.getAttribute("href");
      expect(href).toMatch(/^#/);
      expect(document.querySelector(href ?? "")).not.toBeNull();
    }

    expect(document.querySelector('a[href^="/company-requests/removal"]')).toBeNull();
    const delist = document.getElementById("lpGuideDelist");

    if (!delist) throw new Error("終売・非公開の案内がありません");
    expect(within(delist).getByRole("link", { name: "contact@farmille.com" })).toHaveAttribute(
      "href",
      "mailto:contact@farmille.com",
    );
    const contents = screen.getByRole("navigation", { name: "利用ガイドの目次" });

    for (const link of within(contents).getAllByRole("link")) {
      const target = link.getAttribute("href");
      expect(target).toMatch(/^#/);

      if (!target) throw new Error("目次にリンク先がありません");
      expect(document.getElementById(target.slice(1))).not.toBeNull();
    }
  });
});
