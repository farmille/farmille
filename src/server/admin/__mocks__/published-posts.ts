import { fn } from "storybook/test";

export const listPublishedPosts = fn<
  typeof import("@/server/admin/published-posts").listPublishedPosts
>(async () => ({
  ok: true,
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      type: "review",
      title: "トマト栽培での活用事例",
      href: "内容を確認してください。",
      createdAt: "2026-09-15T09:00:00Z",
    },
  ],
})).mockName("listPublishedPosts");

export const removePublishedPost = fn<
  typeof import("@/server/admin/published-posts").removePublishedPost
>(async () => ({
  ok: true,
  data: {
    id: "11111111-1111-4111-8111-111111111111",
    type: "review",
    materialId: "11111111-1111-4111-8111-111111111111",
    authorUserId: "11111111-1111-4111-8111-111111111111",
  },
})).mockName("removePublishedPost");
