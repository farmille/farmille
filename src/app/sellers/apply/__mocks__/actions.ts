import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const sellerApplyAction = fn<Actions["sellerApplyAction"]>(async () => ({
  status: "done",
  message: "Storybook 上でメーカー申請を受け付けました。",
}));
