import { fn } from "storybook/test";
export const reserveApplicationEvidence = fn<
  typeof import("@/server/company-application-evidence").reserveApplicationEvidence
>(async () => ({ id: "11111111-1111-4111-8111-111111111111", path: "", token: "" })).mockName(
  "reserveApplicationEvidence",
);
export const finalizeApplicationEvidence = fn<
  typeof import("@/server/company-application-evidence").finalizeApplicationEvidence
>(async () => false).mockName("finalizeApplicationEvidence");
export const removeApplicationEvidence = fn<
  typeof import("@/server/company-application-evidence").removeApplicationEvidence
>(async () => false).mockName("removeApplicationEvidence");
export const downloadApplicationEvidence = fn<
  typeof import("@/server/company-application-evidence").downloadApplicationEvidence
>(async () => "").mockName("downloadApplicationEvidence");
export const cleanupExpiredApplicationUploads = fn<
  typeof import("@/server/company-application-evidence").cleanupExpiredApplicationUploads
>(async () => undefined).mockName("cleanupExpiredApplicationUploads");
