import { describe, expect, it } from "vitest";

import { orderedReviewCrops, reviewCropLabel } from "@/server/reviews/crop-relations";

describe("感想口コミの作目", () => {
  it("作物マスタの作目を返す", () => {
    const relation = {
      sort_order: 0,
      crop_name_other: null,
      crop: { id: "crop-1", name: "トマト" },
    };

    expect(orderedReviewCrops(relation)).toEqual([{ id: "crop-1", name: "トマト" }]);
    expect(reviewCropLabel(relation)).toBe("トマト");
  });

  it("「その他」の名前はIDなしの作目として返す", () => {
    const relation = { sort_order: 0, crop_name_other: "ステビア", crop: null };
    expect(orderedReviewCrops(relation)).toEqual([{ id: null, name: "ステビア" }]);
    expect(reviewCropLabel(relation)).toBe("ステビア");
  });

  it("関連行が無いときはnullを返す", () => {
    expect(orderedReviewCrops(null)).toBeNull();
    expect(reviewCropLabel(null)).toBeNull();
  });
});
