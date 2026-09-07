import { describe, expect, it } from "vitest";

import { TAG_CATEGORY_LABELS, toTagChipCategory } from "@/lib/tag-categories";

describe("タグ分類の表示", () => {
  it("DB の condition を画面用の栽培条件へ変換する", () => {
    expect(toTagChipCategory("condition")).toBe("cond");
    expect(TAG_CATEGORY_LABELS[toTagChipCategory("condition")]).toBe("栽培条件");
  });

  it("未知の分類を表示しない", () => {
    expect(() => toTagChipCategory("unknown")).toThrow("未対応のタグ分類です：unknown");
  });
});
