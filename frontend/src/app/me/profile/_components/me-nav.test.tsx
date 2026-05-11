import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MeNav } from "./me-nav";

// Phase 19: me-nav の active 状態が pathnameOverride で正しく出ることを確認。
describe("MeNav", () => {
  it("marks /me/profile as the current page when pathname matches", () => {
    render(<MeNav pathnameOverride="/me/profile" />);
    const profileLink = screen.getByRole("link", { name: "プロフィール" });
    expect(profileLink).toHaveAttribute("aria-current", "page");

    const reviewsLink = screen.getByRole("link", { name: "レビュー" });
    expect(reviewsLink).not.toHaveAttribute("aria-current");
  });

  it("treats subpaths under the active item as still active", () => {
    render(<MeNav pathnameOverride="/me/profile/edit" />);
    expect(
      screen.getByRole("link", { name: "プロフィール" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("renders all three top-level destinations", () => {
    render(<MeNav pathnameOverride="/me/reviews" />);
    expect(screen.getByRole("link", { name: "プロフィール" })).toHaveAttribute(
      "href",
      "/me/profile",
    );
    expect(screen.getByRole("link", { name: "レビュー" })).toHaveAttribute(
      "href",
      "/me/reviews",
    );
    expect(screen.getByRole("link", { name: "マイ資材" })).toHaveAttribute(
      "href",
      "/me/materials",
    );
  });
});
