import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeContent } from "./home-content";
import type { Banner } from "./banner-card";
import type { FeaturedProduct } from "./featured-products-section";
import type { HomeArticle } from "./latest-articles-section";

// 2026-05-27 demo polish:
//   - BannersSection は撤去、検証アサーションも削除
//   - 旧 SearchBar pill → 「資材一覧を見る」CTA ボタンに変更
//   - banners prop は型として残っている（/v1/home 互換維持）が描画されない

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
  it("always renders the products CTA button", () => {
    render(<HomeContent banners={[]} featured={[]} articles={[]} />);
    expect(
      screen.getByRole("link", { name: "資材一覧を見る" }),
    ).toBeInTheDocument();
  });

  it("shows the empty fallback when featured and articles are both empty", () => {
    render(<HomeContent banners={[]} featured={[]} articles={[]} />);
    expect(
      screen.getByText("まだ表示できるコンテンツがありません"),
    ).toBeInTheDocument();
  });

  it("does not render banners even when banners prop is populated (banners deprecated on `/`)", () => {
    render(<HomeContent banners={[banner]} featured={[]} articles={[]} />);
    // バナーセクションは撤去済み: テストバナータイトルは出ない
    expect(screen.queryByText("テストバナー")).not.toBeInTheDocument();
    // aria-label="お知らせ" の section もない
    expect(screen.queryByLabelText("お知らせ")).not.toBeInTheDocument();
  });

  it("renders featured and articles sections when populated", () => {
    render(
      <HomeContent
        banners={[banner]}
        featured={[featured]}
        articles={[article]}
      />,
    );
    expect(screen.getByText("資材 X")).toBeInTheDocument();
    expect(screen.getByText("5月レポート")).toBeInTheDocument();
    expect(
      screen.queryByText("まだ表示できるコンテンツがありません"),
    ).not.toBeInTheDocument();
  });
});
