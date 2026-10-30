import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const changePasswordAction = fn<Actions["changePasswordAction"]>(async () => ({
  status: "done",
  message: "パスワードを変更しました。新しいパスワードでログインしてください。",
}));
