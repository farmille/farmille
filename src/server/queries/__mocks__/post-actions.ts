import { fn } from "storybook/test";
import type { listSavedPosts as ListSavedPosts } from "../post-actions";

export const listSavedPosts = fn<typeof ListSavedPosts>(async () => []).mockName("listSavedPosts");

export const getPostActions = fn(async () => ({
  saved: false,
  voted: false,
  own: false,
  viewCount: 24,
})).mockName("getPostActions");
