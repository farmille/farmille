import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { MaterialCard } from "@/components/MaterialCard";
import { HomeMaterialMarquee } from "./HomeMaterialMarquee";

afterEach(cleanup);

const materials = [
  { name: "ツチイキル", maker: "グリーンバイオ株式会社" },
  { name: "根活バチルス", maker: "日本マイクロ農研" },
  { name: "菌根王 ハイパワー", maker: "みどり化成工業" },
];

function cards() {
  return materials.map((material) =>
    createElement(MaterialCard, {
      key: material.name,
      variant: "scroll",
      name: material.name,
      maker: material.maker,
      rating: 4,
      reviewCount: 12,
      href: `/materials/${material.name}`,
    }),
  );
}

describe("掲載資材のマーキー", () => {
  // happy-dom には Element.prototype.animate が無く、幅も 0 を返すので必ず静止表示になる。
  it("アニメーションできない環境では静止表示に落として複製を描画しない", () => {
    render(createElement(HomeMaterialMarquee, null, cards()));
    const frame = document.querySelector("[data-ui='home-material-marquee']");
    expect(frame?.getAttribute("data-mode")).toBe("static");
    // ループ用の複製を持たないので、トラックの子はカード1セットだけになる。
    expect(frame?.firstElementChild?.children).toHaveLength(1);
  });

  it("静止表示でも渡したカードだけを1回ずつ描画する", () => {
    render(createElement(HomeMaterialMarquee, null, cards()));
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(materials.length);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      materials.map((material) => `/materials/${material.name}`),
    );
  });
});
