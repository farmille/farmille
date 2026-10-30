import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ArchivedNotice,
  MaterialNoticePointer,
  MaterialSpecDisclaimer,
  PostsCompliance,
} from "./MaterialCompliance";

const meta = {
  title: "Pages/materials/[id]/MaterialCompliance",
  component: MaterialSpecDisclaimer,
} satisfies Meta<typeof MaterialSpecDisclaimer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SpecDisclaimer: Story = {};

export const NoticePointer: Story = {
  render: () => <MaterialNoticePointer />,
};

export const Posts: Story = {
  render: () => <PostsCompliance />,
};

export const Archived: Story = {
  render: () => <ArchivedNotice />,
};
