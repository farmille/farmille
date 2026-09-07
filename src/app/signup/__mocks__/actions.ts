import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const signupAction = fn<Actions["signupAction"]>(async () => ({
  status: "done",
  message: "Storybook 上で登録操作を受け付けました。",
}));
