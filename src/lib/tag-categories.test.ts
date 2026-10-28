import { describe, expect, it } from "vitest";

import { toTagChipCategory } from "@/lib/tag-categories";

describe("タグ分類の表示", () => {
  it("DB の condition を画面用の栽培条件へ変換する", () => {
    expect(toTagChipCategory("condition")).toBe("cond");
  });

  it("未知の分類を表示しない", () => {
    expect(() => toTagChipCategory("unknown")).toThrow("未対応のタグ分類です：unknown");
  });
});
