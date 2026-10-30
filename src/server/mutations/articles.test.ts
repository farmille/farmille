import { describe, expect, it } from "vitest";

import { validateArticleInput } from "@/server/mutations/articles";

const materialId = "11111111-1111-4111-8111-111111111111";

describe("validateArticleInput", () => {
  it("タイトルと本文が揃えば下書き入力を正規化する", () => {
    const result = validateArticleInput({
      title: "  高温対策ガイド  ",
      body: "本文です",
      heroImageUrl: "",
      status: "draft",
      materialIds: JSON.stringify([materialId]),
    });

    expect(result.ok).toBe(true);

    if (!result.ok) return;
    expect(result.input).toEqual({
      title: "高温対策ガイド",
      body: "本文です",
      heroImageUrl: null,
      status: "draft",
      materialIds: [materialId],
    });
  });

  it("タイトルまたは本文が空なら拒否する", () => {
    const result = validateArticleInput({
      title: "  ",
      body: "",
      heroImageUrl: null,
      status: "published",
      materialIds: "[]",
    });

    expect(result.ok).toBe(false);

    if (result.ok) return;
    expect(result.fieldErrors.title).toBe("タイトルを入力してください。");
    expect(result.fieldErrors.body).toBe("本文を入力してください。");
  });

  it("不正なヒーロー画像URLと資材IDを拒否する", () => {
    const result = validateArticleInput({
      title: "タイトル",
      body: "本文",
      heroImageUrl: "javascript:alert(1)",
      status: "draft",
      materialIds: '["not-a-uuid"]',
    });

    expect(result.ok).toBe(false);

    if (result.ok) return;
    expect(result.fieldErrors.heroImageUrl).toBeDefined();
    expect(result.fieldErrors.materialIds).toBeDefined();
  });
});
