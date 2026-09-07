import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PublicationStatusForm } from "./PublicationStatusForm";

const meta = {
  title: "App/Admin/Materials/PublicationStatusForm",
  component: PublicationStatusForm,
  args: {
    materialId: "00000000-0000-4000-8000-000000000101",
    status: "published",
  },
} satisfies Meta<typeof PublicationStatusForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Published: Story = {};

export const Archived: Story = {
  args: { status: "archived" },
};
