import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeReviewFeed } from "./HomeReviewFeed";

const meta = {
  title: "App/Home/ReviewFeed",
  component: HomeReviewFeed,
  args: {
    reviews: [],
    orders: { newest: [], helpful: [] },
    viewerUserId: null,
    reportSort: "newest",
    reviewSort: "helpful",
  },
} satisfies Meta<typeof HomeReviewFeed>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
