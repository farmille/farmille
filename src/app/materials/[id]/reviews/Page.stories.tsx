import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { listReviewsByMaterial } from "@/server/queries/reviews";

import Page from "./page";
import { detailedReview, materialReviews, withdrawnReview } from "../_components/story-fixtures";
import { preparePageSession } from "../../../../../.storybook/page-session";

const meta = {
  title: "Pages/materials/[id]/reviews",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/materials/00000000-0000-4000-8000-000000000101/reviews" } },
  },
  args: {
    searchParams: Promise.resolve({}),
    params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000101" }),
  },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

/** 写真つきと文章だけの口コミが混ざるとき。PC では2列に並ぶ。 */
export const WithPhotos: Story = {
  beforeEach: () => {
    const items = [detailedReview, ...materialReviews, withdrawnReview];
    mocked(listReviewsByMaterial).mockResolvedValue({
      ok: true,
      data: { items, page: 1, perPage: 20, total: items.length, totalPages: 1 },
    });
  },
};
