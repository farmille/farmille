import { fn } from "storybook/test";

type Actions = typeof import("../actions");

const success = { status: "success", message: "Storybook 上で操作を受け付けました。" } as const;

export const cancelMaterialChangeRequestAction = fn<Actions["cancelMaterialChangeRequestAction"]>(
  async () => success,
);
