import { fn } from "storybook/test";
import {
  ownProfile,
  ownPosts,
  savedMaterials,
  helpfulItems,
} from "@/app/me/_components/story-fixtures";
export const getMyPageData = fn<typeof import("@/server/queries/me-page").getMyPageData>(
  async () => ({
    ok: true,
    data: {
      profile: ownProfile,
      reportCount: 3,
      reviewCount: 12,
      helpfulReceivedCount: 25,
      posts: ownPosts,
      savedMaterials,
      helpfulItems,
    },
  }),
).mockName("getMyPageData");
