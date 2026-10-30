import { fn } from "storybook/test";
import { legacyReport } from "@/app/reports/[id]/story-fixtures";
import type { listRecentUsageReports as ListRecentUsageReports } from "../usage-reports";

export const listRecentUsageReports = fn<typeof ListRecentUsageReports>(async () => ({
  ok: true,
  data: [],
})).mockName("listRecentUsageReports");

export const getPublishedUsageReport = fn<
  typeof import("@/server/queries/usage-reports").getPublishedUsageReport
>(async () => ({ ok: true, data: legacyReport })).mockName("getPublishedUsageReport");
