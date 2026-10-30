import { fn } from "storybook/test";

export const after = fn<typeof import("next/server").after>();
