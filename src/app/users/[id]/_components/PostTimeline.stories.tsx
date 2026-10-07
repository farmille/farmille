import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PostTimeline } from "./PostTimeline";
import { publicPosts, publicProfile } from "./story-fixtures";

const meta = {
  title: "App/Users/PostTimeline",
  component: PostTimeline,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: { profile: publicProfile, posts: publicPosts, viewerUserId: null },
} satisfies Meta<typeof PostTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visitor: Story = {};

export const Owner: Story = {
  args: { viewerUserId: publicProfile.userId },
};

export const Empty: Story = {
  args: { posts: [] },
};
