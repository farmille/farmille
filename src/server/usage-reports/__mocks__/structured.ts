import { fn } from "storybook/test";
import { structuredReport } from "@/app/reports/[id]/story-fixtures";
export const saveStructuredUsageReport = fn<
  typeof import("@/server/usage-reports/structured").saveStructuredUsageReport
>(async () => ({
  ok: true,
  status: "draft",
  reportId: "11111111-1111-4111-8111-111111111111",
  updatedAt: "2026-09-15T09:00:00Z",
  message: "",
})).mockName("saveStructuredUsageReport");
export const getStructuredReportFormData = fn<
  typeof import("@/server/usage-reports/structured").getStructuredReportFormData
>(async () => ({
  ok: true,
  data: {
    documentUrls: [],
    crops: [
      {
        id: "00000000-0000-4000-8000-000000000304",
        name: "トマト",
        aliases: ["ミニトマト"],
        sort_order: 10,
        groupId: "00000000-0000-4000-8000-000000000305",
        groupName: "果菜類",
        groupSortOrder: 10,
      },
    ],
    effects: [
      {
        id: "00000000-0000-4000-8000-000000000302",
        name: "耐暑性改善",
        sort_order: 10,
        categoryId: "00000000-0000-4000-8000-000000000303",
        categoryName: "その他",
        categorySortOrder: 40,
      },
    ],
    favoriteCropIds: [],
    materialCropIds: [],
    draft: {
      ...structuredReport,
      materialId: "00000000-0000-4000-8000-000000000101",
      cropId: "00000000-0000-4000-8000-000000000304",
    },
    pdfValuesCheckRequired: false,
    submitted: [],
  },
})).mockName("getStructuredReportFormData");
