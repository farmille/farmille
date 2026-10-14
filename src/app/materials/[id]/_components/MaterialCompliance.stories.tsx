import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ArchivedNotice,
  MaterialPageCompliance,
  MaterialSpecDisclaimer,
  PostsCompliance,
} from "./MaterialCompliance";

const meta = {
  title: "Pages/materials/[id]/MaterialCompliance",
  component: MaterialPageCompliance,
  args: { makerVerified: true },
} satisfies Meta<typeof MaterialPageCompliance>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MakerVerified: Story = {};

export const OperatorWritten: Story = {
  args: { makerVerified: false },
};

export const SpecDisclaimer: Story = {
  render: () => <MaterialSpecDisclaimer />,
};

export const Posts: Story = {
  render: () => <PostsCompliance />,
};

export const Archived: Story = {
  render: () => <ArchivedNotice />,
};
