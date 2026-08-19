import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const sellerOperationAction = fn<Actions["sellerOperationAction"]>(async () => ({
  status: "done",
  message: "Storybook 上で出品者情報を更新しました。",
}));
