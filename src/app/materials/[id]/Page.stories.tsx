import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";

import { getSessionUser } from "@/server/auth";
import { listReviewsByMaterial } from "@/server/queries/reviews";

import Page from "./page";
import { detailedReview, materialReviews } from "./_components/story-fixtures";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/materials/[id]",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/materials/00000000-0000-4000-8000-000000000101" } },
  },
  args: {
    searchParams: Promise.resolve({}),
    params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000101" }),
  },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
/** 会員の表示。レポートのカードに都道府県と比較のグラフを添える。 */
export const Default: Story = {};

/** ログインしていない閲覧者。レポートのカードはグラフの代わりにログインの案内を出す。 */
export const SignedOut: Story = {
  beforeEach: () => {
    mocked(getSessionUser).mockResolvedValue(null);
  },
};

/** 写真つきの感想口コミがあるとき。1枚目の写真をカードの先頭に大きく出す。 */
export const ReviewsWithPhotos: Story = {
  beforeEach: () => {
    const items = [detailedReview, ...materialReviews];
    mocked(listReviewsByMaterial).mockResolvedValue({
      ok: true,
      data: { items, page: 1, perPage: 20, total: items.length, totalPages: 1 },
    });
  },
};
