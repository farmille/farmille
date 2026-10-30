import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const sellerPasswordResetAction = fn<Actions["sellerPasswordResetAction"]>(async () => ({
  status: "done",
  message: "登録情報が一致する場合、連絡先メールアドレスに再設定用のメールが届きます。",
}));
