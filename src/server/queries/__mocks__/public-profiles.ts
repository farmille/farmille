import { fn } from "storybook/test";
import { publicProfile, publicPosts } from "@/app/users/[id]/_components/story-fixtures";
export const getPublicProfilePage = fn<
  typeof import("@/server/queries/public-profiles").getPublicProfilePage
>(async () => ({
  ok: true,
  data: { profile: publicProfile, reviewCount: 12, helpfulCount: 25, posts: publicPosts },
})).mockName("getPublicProfilePage");
