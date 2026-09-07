import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const requestPasswordResetAction = fn<Actions["requestPasswordResetAction"]>(async () => ({
  status: "done",
  message: "再設定用のメールを送信しました。",
}));
