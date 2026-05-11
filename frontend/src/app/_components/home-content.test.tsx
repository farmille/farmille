import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeContent } from "./home-content";
import type { Banner } from "./banner-card";
import type { FeaturedProduct } from "./featured-products-section";
import type { HomeArticle } from "./latest-articles-section";

const banner: Banner = {
  id: "b1",
  title: "テストバナー",
  image_url: "https://example.supabase.co/b/x.png",
  link_url: "/articles/x",
  sort_order: 0,
};

const featured: FeaturedProduct = {
  id: "f1",
  sort_order: 0,
  product: {
    id: "p1",
    name: "資材 X",
    maker_name: "ACME Bio",
    image_url: "https://example.supabase.co/p/x.png",
    type_name: "BS資材",
  },
};

const article: HomeArticle = {
  id: "a1",
  slug: "monthly-2026-05",
  title: "5月レポート",
  category: "monthly_report",
  hero_image_url: null,
  published_at: "2026-05-01T00:00:00Z",
  excerpt: "今月のサマリ",
};

describe("HomeContent", () => {
  it("always renders the search bar (spec §6.1)", () => {
    render(<HomeContent banners={[]} featured={[]} articles={[]} />);
    expect(
      screen.getByLabelText("資材を検索"),
    ).toBeInTheDocument();
  });

  it("shows the empty fallback when all 3 sections are empty (spec §1.2 / §9.2)", () => {
    render(<HomeContent banners={[]} featured={[]} articles={[]} />);
    expect(
      screen.getByText("まだ表示できるコンテンツがありません"),
    ).toBeInTheDocument();
  });

  it("hides individual sections when their list is empty (spec §1.2)", () => {
    render(<HomeContent banners={[]} featured={[featured]} articles={[]} />);
    // banners セクションは描画されない (aria-label="お知らせ" を持たない)
    expect(screen.queryByLabelText("お知らせ")).not.toBeInTheDocument();
    // featured は出る
    expect(screen.getByText("資材 X")).toBeInTheDocument();
  });

  it("renders all 3 sections when populated", () => {
    render(
      <HomeContent
        banners={[banner]}
        featured={[featured]}
        articles={[article]}
      />,
    );
    // banners section
    expect(screen.getByText("テストバナー")).toBeInTheDocument();
    // featured section
    expect(screen.getByText("資材 X")).toBeInTheDocument();
    // articles section
    expect(screen.getByText("5月レポート")).toBeInTheDocument();
    // empty fallback は出ない
    expect(
      screen.queryByText("まだ表示できるコンテンツがありません"),
    ).not.toBeInTheDocument();
  });
});
