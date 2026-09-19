import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { css } from "../../../../../styled-system/css";

import { MaterialHero } from "./MaterialHero";
import { materialDetail } from "./story-fixtures";

describe("MaterialHero", () => {
  it("画像の読み込みに失敗してもプレースホルダーを残す", () => {
    const material = {
      ...materialDetail,
      images: [
        {
          id: "00000000-0000-4000-8000-000000000799",
          url: "/missing-material-image.png",
          image_type: "package",
          sort_order: 0,
        },
      ],
    };
    render(createElement(MaterialHero, { material, saved: null }));

    const image = screen.getByRole("img", { name: material.name });
    const imageBox = document.querySelector('[data-ui="material-hero-image"]');
    const placeholder = imageBox?.querySelector<SVGElement>("svg[aria-hidden='true']") ?? null;
    const imageLayer = css({ gridArea: "1 / 1" });
    expect(imageBox).toContainElement(image);
    expect(placeholder).toBeInTheDocument();
    expect(image).toHaveClass(imageLayer);
    expect(placeholder).toHaveClass(imageLayer);

    fireEvent.error(image);

    expect(screen.queryByRole("img", { name: material.name })).not.toBeInTheDocument();
    expect(placeholder).toBeInTheDocument();
    expect(imageBox).toContainElement(placeholder);
  });

  it("追加の製品画像も表示する", () => {
    const material = {
      ...materialDetail,
      images: [
        { id: "first", url: "/first.png", image_type: "package", sort_order: 0 },
        { id: "second", url: "/second.png", image_type: "package", sort_order: 1 },
      ],
    };
    render(createElement(MaterialHero, { material, saved: null }));
    expect(screen.getByRole("img", { name: `${material.name}の製品画像2` })).toBeInTheDocument();
  });

  it("画像がない場合もプレースホルダーを画像領域内に表示する", () => {
    render(createElement(MaterialHero, { material: materialDetail, saved: null }));

    const imageBox = document.querySelector('[data-ui="material-hero-image"]');
    const placeholder = imageBox?.querySelector<SVGElement>("svg[aria-hidden='true']") ?? null;

    expect(screen.queryByRole("img", { name: materialDetail.name })).not.toBeInTheDocument();
    expect(imageBox).toContainElement(placeholder);
    expect(placeholder).toHaveClass(css({ gridArea: "1 / 1" }));
  });
});
