import { fn } from "storybook/test";
type Actions = typeof import("../actions");
export const saveRegisteredContactAction = fn<Actions["saveRegisteredContactAction"]>(async () => ({
  status: "done",
  message: "登録情報を保存しました。",
}));
