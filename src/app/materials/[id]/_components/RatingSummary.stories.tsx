import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RatingSummary } from "./RatingSummary";

const meta = {
  title: "Pages/materials/[id]/RatingSummary",
  component: RatingSummary,
  args: {
    average: 4.2,
    reviewCount: 18,
    distribution: {
      total: 18,
      stars: [
        { rating: 5, count: 9 },
        { rating: 4, count: 6 },
        { rating: 3, count: 2 },
        { rating: 2, count: 1 },
        { rating: 1, count: 0 },
      ],
    },
  },
} satisfies Meta<typeof RatingSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoReviews: Story = {
  args: {
    average: null,
    reviewCount: 0,
    distribution: {
      total: 0,
      stars: [
        { rating: 5, count: 0 },
        { rating: 4, count: 0 },
        { rating: 3, count: 0 },
        { rating: 2, count: 0 },
        { rating: 1, count: 0 },
      ],
    },
  },
};
