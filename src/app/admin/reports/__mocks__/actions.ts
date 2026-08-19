import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const processContentReportAction = fn<Actions["processContentReportAction"]>(async () => ({
  status: "done",
  message: "Storybook 上で通報を処理しました。",
}));
