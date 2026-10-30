import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { ArticlesToolbar } from "./ArticlesToolbar";

const meta = {
  title: "Pages/Shared/ArticlesToolbar",
  component: ArticlesToolbar,
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
  decorators: [
    (Story) => (
      <NuqsTestingAdapter searchParams="?type=report" hasMemory>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
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
  decorators: [
    (Story) => (
      <NuqsTestingAdapter searchParams="?type=article&q=トマト" hasMemory>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
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
  decorators: [
    (Story) => (
      <NuqsTestingAdapter searchParams="?q=うどんこ病" hasMemory>
        <Story />
      </NuqsTestingAdapter>
    ),
  ],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/articles",
        query: { q: "うどんこ病" },
      },
    },
  },
};
