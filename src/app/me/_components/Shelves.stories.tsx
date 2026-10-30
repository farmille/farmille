import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";
import { HelpfulShelf, PostsShelf, SavedShelf } from "./Shelves";
import { helpfulItems, ownPosts, ownProfile, savedMaterials } from "./story-fixtures";

const meta = {
  title: "Pages/me/Shelves",
  component: PostsShelf,
  args: { profile: ownProfile, posts: ownPosts },
} satisfies Meta<typeof PostsShelf>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllSections: Story = {
  render: (args) => (
    <div className={css({ display: "flex", flexDirection: "column", gap: "8" })}>
      <PostsShelf {...args} />
      <SavedShelf items={savedMaterials} />
      <HelpfulShelf items={helpfulItems} />
    </div>
  ),
};

export const Empty: Story = {
  args: { posts: [] },
  render: (args) => (
    <div className={css({ display: "flex", flexDirection: "column", gap: "8" })}>
      <PostsShelf {...args} />
      <SavedShelf items={[]} />
      <HelpfulShelf items={[]} />
    </div>
  ),
};
