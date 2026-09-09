import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeFeedOrder } from "./HomeFeedOrder";
const meta = {
  title: "App/Home/FeedOrder",
  component: HomeFeedOrder,
  args: { target: "reviews", reportSort: "newest", reviewSort: "helpful" },
} satisfies Meta<typeof HomeFeedOrder>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Reviews: Story = {};
export const Reports: Story = { args: { target: "reports" } };
