import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RequestDecisionForm } from "./RequestDecisionForm";

const meta = {
  title: "Pages/admin/materials/requests/[id]/RequestDecisionForm",
  component: RequestDecisionForm,
  args: {
    requestId: "00000000-0000-4000-8000-000000000501",
  },
} satisfies Meta<typeof RequestDecisionForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PendingRequest: Story = {};
