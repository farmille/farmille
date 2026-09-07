import { fn } from "storybook/test";

type Actions = typeof import("../actions");

const done = { status: "done", message: "Storybook 上で操作を受け付けました。" } as const;

export const createMaterialAction = fn<Actions["createMaterialAction"]>(async () => done);
export const updateMaterialAction = fn<Actions["updateMaterialAction"]>(async () => done);
export const setMaterialSellerAction = fn<Actions["setMaterialSellerAction"]>(async () => done);
export const setMaterialPublicationStatusAction = fn<Actions["setMaterialPublicationStatusAction"]>(
  async () => done,
);
