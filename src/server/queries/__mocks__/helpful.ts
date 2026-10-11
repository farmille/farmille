import { fn } from "storybook/test";
export const isHelpfulVotedByViewer = fn<
  typeof import("@/server/queries/helpful").isHelpfulVotedByViewer
>(async () => ({ ok: true, data: false })).mockName("isHelpfulVotedByViewer");
