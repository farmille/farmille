import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReadingPageSkeleton } from "./ReadingPageSkeleton";
const meta = {
  title: "App/ReadingPageSkeleton",
  component: ReadingPageSkeleton,
  args: { title: "実証詳細レポート", variant: "report" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ReadingPageSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Article: Story = { args: { title: "記事", variant: "article" } };
