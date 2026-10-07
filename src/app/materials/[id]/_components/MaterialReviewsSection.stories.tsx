import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialReviewsSection } from "./MaterialReviewsSection";
import { RatingSummary } from "./RatingSummary";
import { detailedReview, materialReviews, withdrawnReview } from "./story-fixtures";

const meta = {
  title: "App/Materials/MaterialReviewsSection",
  component: MaterialReviewsSection,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: {
    materialPath: "/materials/storybook",
    reviews: [...materialReviews, detailedReview, withdrawnReview],
    total: 18,
    viewerUserId: null,
    rating: (
      <RatingSummary
        average={4.2}
        reviewCount={18}
        distribution={{
          total: 18,
          stars: [
            { rating: 5, count: 9 },
            { rating: 4, count: 6 },
            { rating: 3, count: 2 },
            { rating: 2, count: 1 },
            { rating: 1, count: 0 },
          ],
        }}
      />
    ),
  },
} satisfies Meta<typeof MaterialReviewsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { reviews: [], total: 0, rating: null },
};
