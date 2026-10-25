import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const saveUsageReportDraftAction = fn<Actions["saveUsageReportDraftAction"]>(
  async (_materialId, payload) => ({
    ok: true,
    status: "draft",
    reportId: payload.reportId,
    updatedAt: new Date().toISOString(),
    message: "下書きを保存しました。",
  }),
);

export const submitUsageReportAction = fn<Actions["submitUsageReportAction"]>(
  async (_materialId, payload) => ({
    ok: true,
    status: "pending",
    reportId: payload.reportId,
    updatedAt: new Date().toISOString(),
    message: "レポートを受け付けました。",
  }),
);

export const searchReportMaterialsAction = fn<Actions["searchReportMaterialsAction"]>(async () => ({
  ok: true,
  data: [
    {
      id: "00000000-0000-4000-8000-000000000102",
      name: "根圏サポートA",
      manufacturer_name: "ファーム技研",
      review_count: 9,
      avg_rating: 3.8,
      manufacturer_verified_at: null,
    },
  ],
}));

export const getReportMaterialClassificationsAction = fn<
  Actions["getReportMaterialClassificationsAction"]
>(async () => ({
  ok: true,
  data: { cropIds: ["22222222-2222-4222-8222-222222222223"], effectNames: ["発根促進"] },
}));
