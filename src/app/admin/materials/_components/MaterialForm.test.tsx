import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as materialActions from "@/app/admin/materials/actions";
import type { ClassificationOptions } from "@/server/queries/classifications";
import { MaterialForm } from "./MaterialForm";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const classifications: ClassificationOptions = {
  compositionTypes: [],
  cropGroups: [],
  crops: [],
  effectCategories: [
    { id: "growth", name: "生育", sort_order: 1 },
    { id: "quality", name: "品質", sort_order: 2 },
  ],
  effects: [
    {
      id: "root",
      name: "発根",
      sort_order: 1,
      categoryId: "growth",
      categoryName: "生育",
      categorySortOrder: 1,
    },
    {
      id: "color",
      name: "着色",
      sort_order: 1,
      categoryId: "quality",
      categoryName: "品質",
      categorySortOrder: 2,
    },
  ],
  ingredientCategories: [],
  ingredients: [],
  productTypes: [],
  searchTags: [],
};

describe("MaterialForm", () => {
  it("別分類の選択を保って送信し、保存エラー後も入力を残す", async () => {
    const action = vi.spyOn(materialActions, "createMaterialAction").mockResolvedValue({
      status: "error",
      message: "保存できませんでした。",
    });

    render(
      <PathnameContext.Provider value="/admin/materials/new">
        <MaterialForm classifications={classifications} material={null} />
      </PathnameContext.Provider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "資材名" }), {
      target: { value: "試験資材" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "メーカー名" }), {
      target: { value: "試験メーカー" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "発根" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "着色" }));
    expect(screen.getByRole("checkbox", { name: "発根" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const submitted = action.mock.lastCall?.[1];
    expect(submitted?.getAll("effectIds")).toEqual(["root", "color"]);
    expect(await screen.findByText("保存できませんでした。")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "資材名" })).toHaveValue("試験資材");
    expect(screen.getByRole("checkbox", { name: "発根" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "着色" })).toBeChecked();
  });
});
