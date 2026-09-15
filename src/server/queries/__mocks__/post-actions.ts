import { fn } from "storybook/test";

export const getPostActions = fn(async () => ({
  saved: false,
  voted: false,
  own: false,
  viewCount: 24,
})).mockName("getPostActions");
