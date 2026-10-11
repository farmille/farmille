import { fn } from "storybook/test";
import { materialReviews, materialDetail } from "@/app/materials/[id]/_components/story-fixtures";
import type { listRecentReviews as ListRecentReviews } from "../reviews";

export const listRecentReviews = fn<typeof ListRecentReviews>(async () => ({
  ok: true,
  data: [],
})).mockName("listRecentReviews");
export const listReviewsByMaterial = fn<
  typeof import("@/server/queries/reviews").listReviewsByMaterial
>(async () => ({
  ok: true,
  data: {
    items: materialReviews,
    page: 1,
    perPage: 20,
    total: materialReviews.length,
    totalPages: 1,
  },
})).mockName("listReviewsByMaterial");
export const listReviewCropOptions = fn<
  typeof import("@/server/queries/reviews").listReviewCropOptions
>(async () => ({
  ok: true,
  data: [
    {
      id: "00000000-0000-4000-8000-000000000304",
      name: "トマト",
      aliases: ["ミニトマト"],
      groupName: "果菜類",
    },
  ],
})).mockName("listReviewCropOptions");
export const findOwnReviewIdByMaterial = fn<
  typeof import("@/server/queries/reviews").findOwnReviewIdByMaterial
>(async () => ({ ok: true, data: null })).mockName("findOwnReviewIdByMaterial");
export const getReviewForEdit = fn<typeof import("@/server/queries/reviews").getReviewForEdit>(
  async () => ({
    ok: true,
    data: {
      id: "11111111-1111-4111-8111-111111111111",
      material_id: materialDetail.id,
      author_user_id: "11111111-1111-4111-8111-111111111111",
      rating: 4,
      body: "定植後の根張りが揃い、生育が安定しました。",
      pesticide_ack: true,
      status: "published",
      cropIds: ["00000000-0000-4000-8000-000000000304"],
      photos: [],
    },
  }),
).mockName("getReviewForEdit");
