import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArticlesSearchBar } from "./ArticlesSearchBar";

const meta = {
  title: "Articles/ArticlesSearchBar",
  component: ArticlesSearchBar,
  args: { filter: "all", q: "" },
} satisfies Meta<typeof ArticlesSearchBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ReportFilterWithQuery: Story = { args: { filter: "report", q: "トマト 萎れ" } };
