import { fn } from "storybook/test";

type Actions = typeof import("../actions");

const done = { status: "done", message: "Storybook 上でマスタを更新しました。" } as const;

export const tagOperationAction = fn<Actions["tagOperationAction"]>(async () => done);
export const cropOperationAction = fn<Actions["cropOperationAction"]>(async () => done);
