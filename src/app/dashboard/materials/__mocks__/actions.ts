import { fn } from "storybook/test";

type Actions = typeof import("../actions");

const success = { status: "success", message: "Storybook 上で操作を受け付けました。" } as const;

export const submitMaterialCreateAction = fn<Actions["submitMaterialCreateAction"]>(
  async () => success,
);
export const submitMaterialUpdateAction = fn<Actions["submitMaterialUpdateAction"]>(
  async () => success,
);
export const submitMaterialArchiveAction = fn<Actions["submitMaterialArchiveAction"]>(
  async () => success,
);
export const confirmMaterialInformationAction = fn<Actions["confirmMaterialInformationAction"]>(
  async () => success,
);
export const cancelMaterialChangeRequestAction = fn<Actions["cancelMaterialChangeRequestAction"]>(
  async () => success,
);
