import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { MaterialHero } from "./MaterialHero";
import { materialDetail } from "./story-fixtures";

describe("MaterialHero", () => {
  it("代表メーカーの正式名称とリンク先を同じ会社から表示する", () => {
    const material = {
      ...materialDetail,
      manufacturer_name: "旧掲載会社",
      representativeSeller: { id: "maker-id", official_name: "編集権を持つメーカー" },
    };
    render(createElement(MaterialHero, { material, saved: null }));
    expect(screen.getByRole("link", { name: "編集権を持つメーカー" })).toHaveAttribute(
      "href",
      "/sellers/maker-id",
    );
    expect(screen.queryByText("旧掲載会社")).not.toBeInTheDocument();
  });
  it("編集権のない資材は従来の会社名をリンクなしで表示する", () => {
    const material = {
      ...materialDetail,
      seller_id: null,
      representativeSeller: null,
      manufacturer_verified_at: null,
    };
    render(createElement(MaterialHero, { material, saved: null }));
    expect(screen.getByText(material.manufacturer_name)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: material.manufacturer_name }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "contact@farmille.com" })).toHaveAttribute(
      "href",
      "mailto:contact@farmille.com",
    );
  });
  it("メーカー確認済みの資材では会社名の注記を出さない", () => {
    render(createElement(MaterialHero, { material: materialDetail, saved: null }));
    expect(screen.queryByRole("link", { name: "企業会員登録" })).not.toBeInTheDocument();
  });
  it("画像の読み込みに失敗してもプレースホルダーを残す", () => {
    const material = {
      ...materialDetail,
      imageUrl: "/missing-material-image.png",
    };
    render(createElement(MaterialHero, { material, saved: null }));

    const image = screen.getByRole("img", { name: `${materialDetail.name}の容器イメージ` });
    const imageBox = document.querySelector('[data-ui="material-hero-image"]');
    const placeholder = screen.getByText("NO IMAGE");
    expect(imageBox).toContainElement(image);
    expect(placeholder).toHaveAttribute("aria-hidden", "true");

    fireEvent.error(image);

    expect(
      screen.queryByRole("img", { name: `${materialDetail.name}の容器イメージ` }),
    ).not.toBeInTheDocument();
    expect(placeholder).toBeInTheDocument();
    expect(imageBox).toContainElement(placeholder);
  });

  it("容器イラストにイメージ画像であることを表示する", () => {
    render(
      createElement(MaterialHero, {
        material: { ...materialDetail, imageUrl: "/images/container-shapes/2.png" },
        saved: null,
      }),
    );
    expect(
      screen.getByRole("img", { name: `${materialDetail.name}の容器イメージ` }),
    ).toBeInTheDocument();
    expect(screen.getByText("容器のイメージ")).toBeInTheDocument();
  });

  it("画像がない場合もプレースホルダーを画像領域内に表示する", () => {
    render(createElement(MaterialHero, { material: materialDetail, saved: null }));

    const imageBox = document.querySelector('[data-ui="material-hero-image"]');
    const placeholder = screen.getByText("NO IMAGE");

    expect(screen.queryByRole("img", { name: materialDetail.name })).not.toBeInTheDocument();
    expect(imageBox).toContainElement(placeholder);
  });
});
