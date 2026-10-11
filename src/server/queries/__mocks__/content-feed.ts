import { fn } from "storybook/test";
export const listContentFeed = fn<typeof import("@/server/queries/content-feed").listContentFeed>(
  async () => ({
    ok: true,
    data: {
      items: [
        {
          kind: "article",
          id: "11111111-1111-4111-8111-111111111111",
          title: "トマト栽培での活用事例",
          publishedAt: "2026-09-15T09:00:00Z",
          helpfulCount: 3,
          viewCount: 3,
          coverUrl: null,
          organization: "内容を確認してください。",
        },
      ],
      page: 1,
      perPage: 1,
      total: 3,
      totalPages: 1,
    },
  }),
).mockName("listContentFeed");
