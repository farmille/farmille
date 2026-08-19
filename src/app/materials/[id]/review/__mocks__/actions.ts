import { fn } from "storybook/test";

type Actions = typeof import("../actions");

const idle = { status: "idle" } as const;

export const createReviewAction = fn<Actions["createReviewAction"]>(async () => idle);
export const updateReviewAction = fn<Actions["updateReviewAction"]>(async () => idle);
export const deleteReviewAction = fn<Actions["deleteReviewAction"]>(async () => undefined);
