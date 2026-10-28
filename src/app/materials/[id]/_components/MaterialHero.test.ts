import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { MaterialHero } from "./MaterialHero";
import { materialDetail } from "./story-fixtures";

describe("MaterialHero", () => {
  it("代表メーカーの正式名称とリンク先を同じ会社から表示する", () => {
    const material = {
      ...materialDetail,
      manufacturer_name: "旧掲載会社",
      representativeSeller: { id: "maker-id", official_name: "資材オーナー権限を持つメーカー" },
    };
    render(createElement(MaterialHero, { material, saved: null }));
    expect(screen.getByRole("link", { name: "資材オーナー権限を持つメーカー" })).toHaveAttribute(
      "href",
      "/sellers/maker-id",
    );
    expect(screen.queryByRole("link", { name: "contact@farmille.com" })).toBeNull();
    expect(screen.queryByText("旧掲載会社")).not.toBeInTheDocument();
  });
  it("資材オーナー権限のない資材は従来の会社名をリンクなしで表示する", () => {
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
});
