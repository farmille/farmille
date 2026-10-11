import { fn } from "storybook/test";
type Accounts = typeof import("../general");
export const getRegistrationIdentity = fn<Accounts["getRegistrationIdentity"]>(async () => ({
  ok: true,
  data: { userId: "00000000-0000-4000-8000-000000000701", email: "farmer@example.test" },
}));
