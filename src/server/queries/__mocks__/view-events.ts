import { fn } from "storybook/test";
export const recordViewEvent = fn<typeof import("@/server/queries/view-events").recordViewEvent>(
  async () => ({ ok: true, data: null }),
).mockName("recordViewEvent");
