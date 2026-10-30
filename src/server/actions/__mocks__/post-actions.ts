import { fn } from "storybook/test";

export const setPostSavedAction = fn(
  async (_target: string, _id: string, _path: string, saved: boolean) => saved,
).mockName("setPostSavedAction");

export const recordReviewCardView = fn(async (_id: string): Promise<void> => {}).mockName(
  "recordReviewCardView",
);
