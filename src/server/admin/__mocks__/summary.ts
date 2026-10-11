import { fn } from "storybook/test";
export const getAdminSummary = fn<typeof import("@/server/admin/summary").getAdminSummary>(
  async () => ({
    ok: true,
    data: {
      appliedSellerCount: 2,
      openReportCount: 3,
      pendingUsageReportCount: 3,
      pendingMaterialChangeCount: 1,
    },
  }),
).mockName("getAdminSummary");
