import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AdminMfaForms } from "./MFAForms";

const meta = {
  title: "App/Admin/MfaForms",
  component: AdminMfaForms,
  args: {
    verifiedFactorId: null,
    next: "/admin",
  },
} satisfies Meta<typeof AdminMfaForms>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enrollment: Story = {};

export const Verification: Story = {
  args: { verifiedFactorId: "factor-storybook" },
};
