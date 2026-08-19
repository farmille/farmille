import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EditRequestForm } from "./EditRequestForm";

const meta = {
  title: "App/Dashboard/Materials/EditRequestForm",
  component: EditRequestForm,
  args: { materialId: "00000000-0000-4000-8000-000000000101" },
} satisfies Meta<typeof EditRequestForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
