import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const updatePasswordAction = fn<Actions["updatePasswordAction"]>(async () => ({
  status: "done",
  message: "パスワードを変更しました。",
}));
