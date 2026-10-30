import { fn } from "storybook/test";

export const requireAdminAccount = fn<typeof import("@/server/admin/guard").requireAdminAccount>(
  async () => ({ ok: true, data: { userId: "11111111-1111-4111-8111-111111111111" } }),
).mockName("requireAdminAccount");
