import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const updateUsageReportEditorialAction = fn<Actions["updateUsageReportEditorialAction"]>(
  async () => ({
    status: "done",
    message: "Storybook 上で編集内容を保存しました。",
  }),
);
