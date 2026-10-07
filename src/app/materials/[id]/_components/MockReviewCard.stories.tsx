import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PostActionsLoader } from "@/components/PostActionsLoader";

import { MockReviewCard } from "./MockReviewCard";
import { detailedReview, materialReviews, withdrawnReview } from "./story-fixtures";

const review = materialReviews[0];

const meta = {
  title: "App/Materials/MockReviewCard",
  component: MockReviewCard,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: {
    review,
    canManage: false,
    currentPath: "/materials/storybook",
    actions: (
      <PostActionsLoader
        target="review"
        id={review.id}
        currentPath="/materials/storybook"
        helpfulCount={review.helpfulCount}
      />
    ),
  },
} satisfies Meta<typeof MockReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPhotosAndLongName: Story = {
  args: { review: detailedReview },
};

export const WithdrawnAuthor: Story = {
  args: { review: withdrawnReview },
};

export const OwnReview: Story = {
  args: { canManage: true },
};
