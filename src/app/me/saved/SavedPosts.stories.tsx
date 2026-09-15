import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SavedPosts } from "./SavedPosts";

const meta = {
  title: "App/Me/SavedPosts",
  component: SavedPosts,
  args: { userId: "71000000-0000-4000-8000-000000000001" },
} satisfies Meta<typeof SavedPosts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
