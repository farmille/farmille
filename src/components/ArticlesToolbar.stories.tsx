import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArticlesToolbar } from "./ArticlesToolbar";

const meta = {
  title: "Components/ArticlesToolbar",
  component: ArticlesToolbar,
  args: {
    filter: "all",
    q: "",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/articles",
        query: {},
      },
    },
  },
} satisfies Meta<typeof ArticlesToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReportFilter: Story = {
  args: {
    filter: "report",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/articles",
        query: { type: "report" },
      },
    },
  },
};

export const ArticleFilterWithQuery: Story = {
  args: {
    filter: "article",
    q: "トマト",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/articles",
        query: { type: "article", q: "トマト" },
      },
    },
  },
};

export const SearchQuery: Story = {
  args: {
    filter: "all",
    q: "うどんこ病",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/articles",
        query: { q: "うどんこ病" },
      },
    },
  },
};
