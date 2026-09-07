import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const resolveMaterialChangeRequestAction = fn<Actions["resolveMaterialChangeRequestAction"]>(
  async () => ({
    status: "done",
    message: "Storybook 上で申請を処理しました。",
  }),
);
