import { describe, expect, it } from "vitest";

import {
  validateEditRequestText,
  validateEvidenceInput,
  validatePrimaryInformation,
} from "@/server/mutations/seller-dashboard";

const sellerId = "11111111-1111-4111-8111-111111111111";
const materialId = "22222222-2222-4222-8222-222222222222";

describe("validatePrimaryInformation", () => {
  it("一次情報層の8項目を正規化する", () => {
    const result = validatePrimaryInformation({
      description: "  紹介文  ",
      general_use: "",
      ingredients: "菌体",
      mechanism: "作用機序",
      usage_text: "希釈して使用",
      price_range: "1,000円前後",
      official_url: "https://example.com/material",
      catalog_url: "http://example.com/catalog",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.description).toBe("紹介文");
    expect(result.input.general_use).toBeNull();
    expect(Object.keys(result.input)).toEqual([
      "description",
      "general_use",
      "ingredients",
      "mechanism",
      "usage_text",
      "price_range",
      "official_url",
      "catalog_url",
    ]);
  });

  it("HTTP以外のURLを拒否する", () => {
    const result = validatePrimaryInformation({
      description: "",
      general_use: "",
      ingredients: "",
      mechanism: "",
      usage_text: "",
      price_range: "",
      official_url: "javascript:alert(1)",
      catalog_url: "not-a-url",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.official_url).toBeTruthy();
    expect(result.fieldErrors.catalog_url).toBeTruthy();
  });
});

describe("validateEvidenceInput", () => {
  it("外部URLのエビデンスを受け入れる", () => {
    const result = validateEvidenceInput(
      {
        evidenceType: "paper",
        title: "試験論文",
        externalUrl: "https://example.com/paper.pdf",
        storagePath: "",
      },
      sellerId,
      materialId,
    );

    expect(result).toEqual({
      ok: true,
      input: {
        evidenceType: "paper",
        title: "試験論文",
        source: { kind: "external", externalUrl: "https://example.com/paper.pdf" },
      },
    });
  });

  it("自社資材の保存先だけを受け入れる", () => {
    const ownPath = `${sellerId}/${materialId}/evidences/33333333-3333-4333-8333-333333333333.webp`;
    const valid = validateEvidenceInput(
      {
        evidenceType: "sds",
        title: "SDS画像",
        externalUrl: "",
        storagePath: ownPath,
      },
      sellerId,
      materialId,
    );
    const invalid = validateEvidenceInput(
      {
        evidenceType: "sds",
        title: "SDS画像",
        externalUrl: "",
        storagePath: `other/${materialId}/evidences/33333333-3333-4333-8333-333333333333.webp`,
      },
      sellerId,
      materialId,
    );

    expect(valid.ok).toBe(true);
    expect(invalid.ok).toBe(false);
  });

  it("ファイルと外部URLの同時指定を拒否する", () => {
    const result = validateEvidenceInput(
      {
        evidenceType: "trial",
        title: "試験結果",
        externalUrl: "https://example.com/trial",
        storagePath: `${sellerId}/${materialId}/evidences/33333333-3333-4333-8333-333333333333.png`,
      },
      sellerId,
      materialId,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.source).toBeTruthy();
  });
});

describe("validateEditRequestText", () => {
  it("前後の空白を除いて受け入れる", () => {
    expect(validateEditRequestText("  タグを変更してください  ")).toEqual({
      ok: true,
      input: "タグを変更してください",
    });
  });

  it("空の申請を拒否する", () => {
    expect(validateEditRequestText("   ").ok).toBe(false);
  });
});
