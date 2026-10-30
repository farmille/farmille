import { fn } from "storybook/test";

export const getPublicSellerPage = fn<
  typeof import("@/server/queries/public-sellers").getPublicSellerPage
>(async () => ({
  ok: true,
  data: {
    seller: {
      id: "11111111-1111-4111-8111-111111111111",
      officialName: "グリーンバイオ株式会社",
      regionScope: "関東",
      websiteUrl: null,
      logoUrl: null,
      profileText: "微生物の力を活かした資材を開発し、農家の土づくりを支えています。",
    },
    materialCount: 3,
    materials: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "土づくり微生物資材",
        manufacturerName: "グリーンバイオ株式会社",
        averageRating: null,
        reviewCount: 3,
        manufacturerVerified: false,
        imageUrl: null,
      },
    ],
    helpfulCount: 3,
    articles: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "トマト栽培での活用事例",
        heroImageUrl: null,
        publishedAt: "2026-09-15T09:00:00Z",
      },
    ],
  },
})).mockName("getPublicSellerPage");
