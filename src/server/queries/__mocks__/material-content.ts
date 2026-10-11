import { fn } from "storybook/test";
import { materialReports } from "@/app/materials/[id]/_components/story-fixtures";
export const listPublishedUsageReportsByMaterial = fn<
  typeof import("@/server/queries/material-content").listPublishedUsageReportsByMaterial
>(async () => ({
  ok: true,
  data: { items: materialReports, total: materialReports.length },
})).mockName("listPublishedUsageReportsByMaterial");
export const listPublishedArticlesByMaterial = fn<
  typeof import("@/server/queries/material-content").listPublishedArticlesByMaterial
>(async () => ({
  ok: true,
  data: {
    items: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        hero_image_url: null,
        published_at: null,
        seller_id: "00000000-0000-4000-8000-000000000201",
        title: "トマト栽培での活用事例",
        seller: null,
        helpfulCount: 3,
        viewCount: 3,
      },
    ],
    total: 3,
  },
})).mockName("listPublishedArticlesByMaterial");
export const getReviewRatingDistribution = fn<
  typeof import("@/server/queries/material-content").getReviewRatingDistribution
>(async () => ({ ok: true, data: { total: 0, stars: [] } })).mockName(
  "getReviewRatingDistribution",
);
