import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const resolveEditRequestAction = fn<Actions["resolveEditRequestAction"]>(async () => ({
  status: "done",
  message: "Storybook 上で申請を処理しました。",
}));
