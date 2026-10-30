import { fn } from "storybook/test";

export const getAccountPasskeys = fn<
  typeof import("@/server/accounts/passkeys").getAccountPasskeys
>(async () => ({ passkeys: [], accountType: "general" })).mockName("getAccountPasskeys");
