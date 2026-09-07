import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const toggleSavedMaterialAction = fn<Actions["toggleSavedMaterialAction"]>(
  async (_materialId, previous) => ({ saved: !previous.saved }),
);
