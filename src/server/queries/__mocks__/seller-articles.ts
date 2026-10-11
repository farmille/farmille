import { fn } from "storybook/test";
export const listSellerArticles = fn<
  typeof import("@/server/queries/seller-articles").listSellerArticles
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      updated_at: "2026-09-15T09:00:00Z",
      hero_image_url: null,
      published_at: null,
      status: "pending",
      title: "トマト栽培での活用事例",
    },
  ],
})).mockName("listSellerArticles");
export const getSellerArticle = fn<
  typeof import("@/server/queries/seller-articles").getSellerArticle
>(async () => ({
  ok: true,
  data: {
    id: "11111111-1111-4111-8111-111111111111",
    body: "定植前の施用後、根張りと葉色が安定しました。",
    updated_at: "2026-09-15T09:00:00Z",
    hero_image_url: null,
    published_at: null,
    status: "pending",
    title: "トマト栽培での活用事例",
    materials: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "土づくり微生物資材",
        manufacturer_name: "グリーンバイオ株式会社",
      },
    ],
  },
})).mockName("getSellerArticle");
export const searchMaterialsForArticleLink = fn<
  typeof import("@/server/queries/seller-articles").searchMaterialsForArticleLink
>(async () => ({ ok: true, data: [] })).mockName("searchMaterialsForArticleLink");
