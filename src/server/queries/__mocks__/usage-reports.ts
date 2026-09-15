import { fn } from "storybook/test";
import type { listRecentUsageReports as ListRecentUsageReports } from "../usage-reports";

export const listRecentUsageReports = fn<typeof ListRecentUsageReports>(async () => ({
  ok: true,
  data: [],
})).mockName("listRecentUsageReports");
