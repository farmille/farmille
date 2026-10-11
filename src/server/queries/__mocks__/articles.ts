import { fn } from "storybook/test";
export const getPublishedArticle = fn<
  typeof import("@/server/queries/articles").getPublishedArticle
>(async () => ({
  ok: true,
  data: {
    id: "11111111-1111-4111-8111-111111111111",
    title: "トマト栽培での活用事例",
    body: "## トマト栽培での活用\n定植前に施用し、根張りと葉色の変化を観察しました。",
    heroImageUrl: null,
    publishedAt: "2026-09-15T09:00:00Z",
    seller: {
      id: "11111111-1111-4111-8111-111111111111",
      logo_url: null,
      official_name: "グリーンバイオ株式会社",
    },
    materials: [
      {
        id: "00000000-0000-4000-8000-000000000101",
        name: "土づくり微生物資材",
        manufacturer_name: "グリーンバイオ株式会社",
        avg_rating: 4.2,
        manufacturer_verified_at: "2026-09-15T09:00:00Z",
      },
    ],
    helpfulCount: 12,
    viewCount: 86,
  },
})).mockName("getPublishedArticle");
