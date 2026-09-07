import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Pagination } from "./Pagination";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  args: {
    page: 1,
    totalPages: 10,
    hrefForPage: (page: number) => `/materials?page=${page}`,
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {};

export const MiddlePage: Story = {
  args: {
    page: 5,
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
  },
};

export const SinglePage: Story = {
  args: {
    page: 1,
    totalPages: 1,
  },
};
