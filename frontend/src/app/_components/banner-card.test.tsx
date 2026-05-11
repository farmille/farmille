import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BannerCard, type Banner } from "./banner-card";

const baseBanner: Banner = {
  id: "44444444-4444-4444-4444-444444444444",
  title: "新機能のお知らせ",
  image_url: "https://example.supabase.co/b/x.png",
  link_url: "/articles/welcome",
  sort_order: 0,
};

describe("BannerCard", () => {
  it("renders title and image with the banner src/alt", () => {
    render(<BannerCard banner={baseBanner} />);
    expect(screen.getByText("新機能のお知らせ")).toBeInTheDocument();
    const img = screen.getByRole("img", { name: "新機能のお知らせ" });
    expect(img).toHaveAttribute("src", "https://example.supabase.co/b/x.png");
  });

  it("opens external links in a new tab with rel=noopener", () => {
    render(
      <BannerCard
        banner={{ ...baseBanner, link_url: "https://example.com/x" }}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/x");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps internal links in the same tab", () => {
    render(<BannerCard banner={baseBanner} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/articles/welcome");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });
});
