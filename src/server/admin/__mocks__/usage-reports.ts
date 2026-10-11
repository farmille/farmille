import { fn } from "storybook/test";
export function isUsageReportEditorialOperation(
  value: string | null | undefined,
): value is import("@/server/admin/usage-reports").UsageReportEditorialOperation {
  return value === "save" || value === "publish" || value === "decline";
}
export const listPendingUsageReports = fn<
  typeof import("@/server/admin/usage-reports").listPendingUsageReports
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "トマト栽培での活用事例",
      createdAt: "2026-09-15T09:00:00Z",
      author: { userId: "11111111-1111-4111-8111-111111111111", handle: "緑の畑" },
      crop: { id: "11111111-1111-4111-8111-111111111111", name: "土づくり微生物資材" },
      material: { id: "11111111-1111-4111-8111-111111111111", name: "土づくり微生物資材" },
    },
  ],
})).mockName("listPendingUsageReports");
export const getUsageReportEditorialDetail = fn<
  typeof import("@/server/admin/usage-reports").getUsageReportEditorialDetail
>(async () => ({
  ok: true,
  data: {
    formVersion: 0,
    structured: {
      reportId: "11111111-1111-4111-8111-111111111111",
      expectedUpdatedAt: "2026-09-15T09:00:00Z",
      materialId: "11111111-1111-4111-8111-111111111111",
      cropId: "11111111-1111-4111-8111-111111111111",
      variety: "",
      varietyUnknown: false,
      observedChange: "使用区では根張りが揃い、生育が安定しました。",
      purposeTags: [],
      purposeNote: "",
      prefectureCode: 8,
      city: "",
      showCity: false,
      cultivationEnvironment: "",
      timingStages: [],
      timingNote: "",
      plots: [],
      measurements: [],
      media: [],
      documents: [],
      headings: [],
      methodDetailsAck: false,
      documentsAck: false,
      guidelineAck: false,
    },
    documentUrls: [],
    id: "11111111-1111-4111-8111-111111111111",
    title: "トマト栽培での活用事例",
    status: "published",
    createdAt: "2026-09-15T09:00:00Z",
    publishedAt: "2026-09-15T09:00:00Z",
    purposeTags: [],
    purposeNote: "",
    prefectureCode: 8,
    fieldName: "サンプル資材",
    variety: "",
    plantingDate: "2026-09-15T09:00:00Z",
    cultivationType: "",
    cultivationTags: [],
    growthStage: "",
    climateNote: "",
    observedChange: "使用区では根張りが揃い、生育が安定しました。",
    negativeNote: "",
    summary: "使用区では根張りが揃い、生育が安定しました。",
    editorNote: "",
    author: { userId: "11111111-1111-4111-8111-111111111111", handle: "緑の畑" },
    crop: { id: "11111111-1111-4111-8111-111111111111", name: "土づくり微生物資材" },
    material: { id: "11111111-1111-4111-8111-111111111111", name: "土づくり微生物資材" },
    applications: [],
    media: [],
    metrics: [],
  },
})).mockName("getUsageReportEditorialDetail");
export const updateUsageReportEditorial = fn<
  typeof import("@/server/admin/usage-reports").updateUsageReportEditorial
>(async () => ({ ok: true, data: null })).mockName("updateUsageReportEditorial");
export const EDITORIAL_REPORT_STATUS_LABELS: typeof import("@/server/admin/usage-reports").EDITORIAL_REPORT_STATUS_LABELS =
  {
    pending: "確認待ち",
    published: "公開済み",
    declined: "差し戻し",
  };
