import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PostActionsLoader } from "@/components/PostActionsLoader";

import { MaterialReviewCard } from "./MaterialReviewCard";
import { detailedReview, materialReviews, withdrawnReview } from "./story-fixtures";

const review = materialReviews[0];

const meta = {
  title: "Pages/materials/[id]/MaterialReviewCard",
  component: MaterialReviewCard,
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
} satisfies Meta<typeof MaterialReviewCard>;

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
