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
  data: [],
}));
