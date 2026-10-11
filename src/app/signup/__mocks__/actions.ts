import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const signupAction = fn<Actions["signupAction"]>(async () => ({
  status: "done",
  message: "Storybook 上で登録操作を受け付けました。",
}));

export const registrationEmailAction = fn<Actions["registrationEmailAction"]>(async () => ({
  status: "done",
  message:
    "farmer@example.testに認証メールを送信しました。メール内のリンクから登録情報を入力してください。",
}));
