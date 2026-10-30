import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MaterialPageContent } from "@/lib/material-page-editor";

import { MaterialProductInfo } from "./MaterialProductInfo";
import { materialDetail } from "./story-fixtures";

const bareMaterial = {
  ...materialDetail,
  official_name: null,
  main_components: null,
  official_url: null,
  catalog_url: null,
  evidences: [],
  effects: [],
  targetCrops: [],
  targetCropGroups: [],
  applicationMethods: [],
  ingredientCategories: [],
};

const emptyContent: MaterialPageContent = {
  description: "製品説明の本文",
  mainComponents: "",
  mechanism: "",
  links: [],
  images: [],
  timings: [],
  registrations: [],
  relatedCompanies: [],
  certifications: [],
  usages: [],
};

describe("MaterialProductInfo", () => {
  it("値の無い項目と区画を出さず、「−」も出さない", () => {
    render(
      <MaterialProductInfo
        material={{ ...bareMaterial, main_components: "Fe 15,000mg/L" }}
        content={undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: "製品詳細" })).toBeInTheDocument();
    expect(screen.getByText("主な成分")).toBeInTheDocument();
    expect(screen.queryByText("正式名称")).not.toBeInTheDocument();

    for (const name of ["製品説明", "施用タイミング", "リンク・資料"]) {
      expect(screen.queryByRole("heading", { name })).not.toBeInTheDocument();
    }

    expect(screen.queryByText("−")).not.toBeInTheDocument();
  });

  it("製品情報がまったく無い資材では、1行の案内だけを出す", () => {
    render(<MaterialProductInfo material={bareMaterial} content={undefined} />);
    expect(screen.getByText("この資材の製品情報は、まだ登録されていません。")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText(bareMaterial.manufacturer_name)).not.toBeInTheDocument();
  });

  it("原稿で関係会社をすべて外したときは「−」を出す", () => {
    render(<MaterialProductInfo material={bareMaterial} content={emptyContent} />);
    expect(screen.getByText("製品説明の本文")).toBeInTheDocument();
    expect(screen.getByText("関係会社（販売元、製造元、輸入元など）")).toBeInTheDocument();
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "リンク・資料" })).not.toBeInTheDocument();
  });
});
