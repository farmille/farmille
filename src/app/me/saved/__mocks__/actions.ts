import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const unsaveMaterialAction = fn<Actions["unsaveMaterialAction"]>(async () => undefined);
