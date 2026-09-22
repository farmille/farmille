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
  registrations: [],
  relatedCompanies: [],
  certifications: [],
};
const input = {
  materialId: "11111111-1111-4111-8111-111111111111",
  expectedVersion: null,
  content,
  submit: false,
};

describe("製品ページの原稿", () => {
  it("登録事業者の空欄は下書きに保存できるが表現確認へ送れない", () => {
    const draft = {
      ...input,
      content: { ...content, registrations: [{ kind: "pesticide", companyName: "", effects: "" }] },
    };
    expect(v.is(SaveMaterialPageSchema, draft)).toBe(true);
    expect(v.is(SaveMaterialPageSchema, { ...draft, submit: true })).toBe(false);
    expect(
      v.is(SaveMaterialPageSchema, {
        ...draft,
        submit: true,
        content: {
          ...draft.content,
          registrations: [{ kind: "pesticide", companyName: "登録会社", effects: "" }],
        },
      }),
    ).toBe(true);
  });
  it("同じ登録区分を重複保存できない", () => {
    const registration = { kind: "fertilizer", companyName: "会社", effects: "" };
    expect(
      v.is(MaterialPageContentSchema, { ...content, registrations: [registration, registration] }),
    ).toBe(false);
  });
  it("関係会社の空欄や重複は表現確認へ送れない", () => {
    for (const relatedCompanies of [[""], ["会社", " 会社 "]]) {
      expect(
        v.is(SaveMaterialPageSchema, { ...input, content: { ...content, relatedCompanies } }),
      ).toBe(true);
      expect(
        v.is(SaveMaterialPageSchema, {
          ...input,
          submit: true,
          content: { ...content, relatedCompanies },
        }),
      ).toBe(false);
    }
  });
  it("試験資料の分類・概要・実施機関を公開前に確認する", () => {
    const trial = {
      crops: "",
      summary: "概要",
      institution: "試験場",
      year: null,
      pageCount: null,
    };
    const link = { group: "public_trial", title: "試験", url: "https://example.com/trial", trial };
    expect(
      v.is(SaveMaterialPageSchema, {
        ...input,
        submit: true,
        content: { ...content, links: [link] },
      }),
    ).toBe(true);
    for (const incomplete of [
      { ...link, group: null, trial: null },
      { ...link, trial: { ...trial, summary: "" } },
      { ...link, trial: { ...trial, institution: "" } },
    ]) {
      expect(
        v.is(SaveMaterialPageSchema, { ...input, content: { ...content, links: [incomplete] } }),
      ).toBe(true);
      expect(
        v.is(SaveMaterialPageSchema, {
          ...input,
          submit: true,
          content: { ...content, links: [incomplete] },
        }),
      ).toBe(false);
    }
    expect(
      v.is(MaterialPageContentSchema, { ...content, links: [{ ...link, group: "overview" }] }),
    ).toBe(false);
    expect(
      v.is(MaterialPageContentSchema, {
        ...content,
        links: [{ ...link, trial: { ...trial, year: 2025.5 } }],
      }),
    ).toBe(false);
    expect(
      v.is(SaveMaterialPageSchema, {
        ...input,
        submit: true,
        content: { ...content, links: [link, link] },
      }),
    ).toBe(false);
  });
  it("記入途中の資料を下書きに残せる", () => {
    expect(
      v.is(SaveMaterialPageSchema, {
        ...input,
        content: {
          ...content,
          links: [{ trial: null, group: "overview", title: "", url: "入力途中" }],
        },
      }),
    ).toBe(true);
  });
  it("未完成の資料は表現確認へ送れない", () => {
    expect(
      v.is(SaveMaterialPageSchema, {
        ...input,
        submit: true,
        content: {
          ...content,
          links: [{ trial: null, group: "overview", title: "", url: "入力途中" }],
        },
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
