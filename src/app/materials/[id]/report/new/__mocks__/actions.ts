import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const saveUsageReportDraftAction = fn<Actions["saveUsageReportDraftAction"]>(async () => ({
  ok: true,
  status: "draft",
  reportIds: ["00000000-0000-4000-8000-000000001001"],
  message: "Storybook 上で下書きを保存しました。",
}));

export const submitUsageReportAction = fn<Actions["submitUsageReportAction"]>(async () => ({
  ok: true,
  status: "pending",
  reportIds: ["00000000-0000-4000-8000-000000001001"],
  message: "Storybook 上でレポートを提出しました。",
}));
