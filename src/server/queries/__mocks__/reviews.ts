import { fn } from "storybook/test";
import type { listRecentReviews as ListRecentReviews } from "../reviews";

export const listRecentReviews = fn<typeof ListRecentReviews>(async () => ({
  ok: true,
  data: [],
})).mockName("listRecentReviews");
