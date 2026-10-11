import { fn } from "storybook/test";
export const getAdminMfaState = fn<typeof import("@/server/admin/mfa").getAdminMfaState>(
  async () => ({
    ok: true,
    data: { verifiedFactorId: "11111111-1111-4111-8111-111111111111", currentLevel: "aal1" },
  }),
).mockName("getAdminMfaState");
export const startAdminTotpEnrollment = fn<
  typeof import("@/server/admin/mfa").startAdminTotpEnrollment
>(async () => ({
  ok: true,
  data: { factorId: "11111111-1111-4111-8111-111111111111", qrCode: "", secret: "", uri: "" },
})).mockName("startAdminTotpEnrollment");
export const verifyAdminTotpCode = fn<typeof import("@/server/admin/mfa").verifyAdminTotpCode>(
  async () => ({ ok: true, data: null }),
).mockName("verifyAdminTotpCode");
