import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const loginAction = fn<Actions["loginAction"]>(async () => ({
  status: "done",
  message: "Storybook 上でログイン操作を受け付けました。",
}));
