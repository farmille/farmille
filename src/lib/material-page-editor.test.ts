import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  MaterialPageContentSchema,
  MaterialExternalUrlSchema,
  SaveMaterialPageSchema,
} from "./material-page-editor";

const content = {
  description: "製品説明",
  mainComponents: "",
  mechanism: "",
  links: [],
  images: [],
  usages: [],
  timings: [],
  certifications: [],
};
const input = {
  materialId: "11111111-1111-4111-8111-111111111111",
  expectedVersion: null,
  content,
  submit: false,
};

describe("製品ページの原稿", () => {
  it("記入途中の資料を下書きに残せる", () => {
    expect(
      v.is(SaveMaterialPageSchema, {
        ...input,
        content: { ...content, links: [{ group: "overview", title: "", url: "入力途中" }] },
      }),
    ).toBe(true);
  });
  it("未完成の資料は表現確認へ送れない", () => {
    expect(
      v.is(SaveMaterialPageSchema, {
        ...input,
        submit: true,
        content: { ...content, links: [{ group: "overview", title: "", url: "入力途中" }] },
      }),
    ).toBe(false);
  });
  it("空の製品説明は表現確認へ送れない", () => {
    expect(
      v.is(SaveMaterialPageSchema, {
        ...input,
        submit: true,
        content: { ...content, description: " " },
      }),
    ).toBe(false);
  });
  it("公開するリンクはHTTPまたはHTTPSに限る", () => {
    expect(v.is(MaterialExternalUrlSchema, "javascript:alert(1)")).toBe(false);
    expect(v.is(MaterialExternalUrlSchema, "https://example.com/manual.pdf")).toBe(true);
  });
  it("既存画像とアップロード画像を同じ順序で保持できる", () => {
    expect(
      v.is(MaterialPageContentSchema, {
        ...content,
        images: [
          { path: "legacy:11111111-1111-4111-8111-111111111111", alt: "既存画像" },
          {
            path: "33333333-3333-4333-8333-333333333333/11111111-1111-4111-8111-111111111111/55555555-5555-4555-8555-555555555555.png",
            alt: "追加画像",
          },
        ],
      }),
    ).toBe(true);
  });
});
