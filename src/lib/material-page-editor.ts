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
  { value: "safety", label: "使用上の注意（安全データシートなど）" },
  { value: "technical", label: "技術・作用機作" },
  {
    value: "public_trial",
    label: "公的試験結果（都道府県の試験場など公的機関で実施した試験結果）",
  },
  {
    value: "other_trial",
    label: "その他の試験結果（メーカー、大学・研究機関、生産者団体が実施した試験結果）",
  },
] as const;

export const MATERIAL_REGISTRATION_KINDS = [
  {
    value: "pesticide",
    label: "農薬登録",
    companyLabel: "農薬登録者",
    effectsLabel: "農薬としての効果・特徴",
  },
  {
    value: "fertilizer",
    label: "肥料登録・届出",
    companyLabel: "肥料登録・届出事業者",
    effectsLabel: "肥料としての効果・特徴",
  },
  {
    value: "soil_amendment",
    label: "土壌改良資材",
    companyLabel: "表示者（土壌改良資材）",
    effectsLabel: "土壌改良資材としての効果・特徴",
  },
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
    v.pipe(
      v.object({
        group: v.nullable(
          v.picklist(["overview", "safety", "technical", "public_trial", "other_trial"]),
        ),
        title: title(),
        url: v.pipe(v.string(), v.maxLength(4000)),
        trial: v.nullable(
          v.object({
            crops: title(),
            summary: text(),
            institution: title(),
            year: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(9999))),
            pageCount: v.nullable(
              v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
            ),
          }),
        ),
      }),
      v.check(
        (link) =>
          (link.group === "public_trial" || link.group === "other_trial") === (link.trial !== null),
        "試験情報と資料の分類を確認してください。",
      ),
    ),
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
  registrations: v.pipe(
    v.array(
      v.object({
        kind: v.picklist(["pesticide", "fertilizer", "soil_amendment"]),
        companyName: title(),
        effects: text(),
      }),
    ),
    v.check(
      (items) => new Set(items.map((item) => item.kind)).size === items.length,
      "同じ登録区分は1件だけ選択してください。",
    ),
  ),
  relatedCompanies: v.array(title()),
});

export type MaterialPageContent = v.InferOutput<typeof MaterialPageContentSchema>;

export type PesticideRegistration = "registered" | "unregistered" | "unknown";

/**
 * 公開中の製品情報の「登録・認証」から、農薬登録の有無を読む。
 * 製品情報が無い資材と、登録区分を1つも書いていない資材は、書き漏れと区別できないので unknown とする。
 */
export function pesticideRegistrationOf(
  registrations: MaterialPageContent["registrations"] | null,
): PesticideRegistration {
  if (registrations === null || registrations.length === 0) return "unknown";

  return registrations.some((entry) => entry.kind === "pesticide") ? "registered" : "unregistered";
}

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
          (link) =>
            link.group !== null &&
            link.title.trim().length > 0 &&
            v.is(MaterialExternalUrlSchema, link.url),
        ) &&
        new Set(input.content.links.map((link) => link.url.trim())).size ===
          input.content.links.length &&
        input.content.certifications.every((title) => title.trim().length > 0) &&
        input.content.registrations.every((item) => item.companyName.trim().length > 0) &&
        input.content.relatedCompanies.every((name) => name.trim().length > 0) &&
        new Set(input.content.relatedCompanies.map((name) => name.trim())).size ===
          input.content.relatedCompanies.length),
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

export function materialRegistrationRows(registrations: MaterialPageContent["registrations"]) {
  return MATERIAL_REGISTRATION_KINDS.flatMap((kind) => {
    const registration = registrations.find((entry) => entry.kind === kind.value);

    return registration
      ? [
          {
            label: kind.companyLabel,
            value: registration.companyName || "−",
            manufacturerEntry: true,
          },
          { label: kind.effectsLabel, value: registration.effects || "−", manufacturerEntry: true },
        ]
      : [];
  });
}
