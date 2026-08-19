import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const updateProfileAction = fn<Actions["updateProfileAction"]>(async () => ({
  status: "done",
  message: "Storybook 上でプロフィールを保存しました。",
}));
