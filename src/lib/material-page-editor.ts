import * as v from "valibot";

export const APPLICATION_METHODS = [
  { value: "spray", label: "散布" },
  { value: "drench", label: "灌注" },
  { value: "mix", label: "混和" },
  { value: "soak", label: "浸漬" },
  { value: "coat", label: "粉衣・塗布" },
  { value: "other", label: "その他" },
] as const;
export const APPLICATION_TIMINGS = [
  "栽培開始前",
  "播種・定植時",
  "播種・定植直後",
  "生育初〜中期",
  "開花・生殖成長開始期",
  "着果・生育中期",
  "生育後期〜収穫前",
  "収穫後",
] as const;
export const MATERIAL_LINK_GROUPS = [
  { value: "overview", label: "概要（製品説明・パンフレット・画像）" },
  { value: "safety", label: "使用上の注意（ラベル・安全データシート）" },
  { value: "technical", label: "技術（根拠論文・詳細資料）" },
] as const;
const text = () => v.pipe(v.string(), v.maxLength(20000));
const title = () => v.pipe(v.string(), v.maxLength(500));
export const MaterialExternalUrlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.url(),
  v.regex(/^https?:\/\//),
  v.maxLength(4000),
);
export const MaterialPageContentSchema = v.object({
  description: text(),
  mainComponents: text(),
  mechanism: text(),
  links: v.array(
    v.object({
      group: v.picklist(["overview", "safety", "technical"]),
      title: title(),
      url: v.pipe(v.string(), v.maxLength(4000)),
    }),
  ),
  images: v.array(
    v.object({
      path: v.pipe(
        v.string(),
        v.regex(
          /^(legacy:[0-9a-f-]{36}|[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp))$/,
        ),
      ),
      alt: text(),
    }),
  ),
  usages: v.array(
    v.object({
      method: v.picklist(["spray", "drench", "mix", "soak", "coat", "other"]),
      detail: text(),
    }),
  ),
  timings: v.array(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(7))),
  certifications: v.array(title()),
});
export type MaterialPageContent = v.InferOutput<typeof MaterialPageContentSchema>;
export const SaveMaterialPageSchema = v.pipe(
  v.object({
    materialId: v.pipe(v.string(), v.uuid()),
    expectedVersion: v.nullable(v.pipe(v.string(), v.uuid())),
    submit: v.boolean(),
    content: MaterialPageContentSchema,
  }),
  v.check(
    (input) =>
      !input.submit ||
      (input.content.description.trim().length > 0 &&
        input.content.links.every(
          (link) => link.title.trim().length > 0 && v.is(MaterialExternalUrlSchema, link.url),
        ) &&
        input.content.certifications.every((title) => title.trim().length > 0)),
    "公開前に製品説明と資料・登録認証の入力を確認してください。",
  ),
);
export const MATERIAL_PAGE_STATUS_LABELS = {
  draft: "下書き",
  pending: "表現確認中",
  published: "公開済み",
  returned: "修正待ち",
  superseded: "保存履歴",
  withdrawn: "取り下げ済み",
} as const;
