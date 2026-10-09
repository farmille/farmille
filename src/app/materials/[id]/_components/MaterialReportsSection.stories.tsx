import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialReportsView } from "./MaterialReportsSection";
import { materialDetail, materialReports } from "./story-fixtures";

const meta = {
  title: "App/Materials/MaterialReportsSection",
  component: MaterialReportsView,
  args: {
    material: materialDetail,
    reports: { items: materialReports, total: 5 },
    articleTotal: 0,
    signedIn: true,
  },
} satisfies Meta<typeof MaterialReportsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const SignedOutWithArticles: Story = {
  args: { signedIn: false, articleTotal: 2 },
};

export const Empty: Story = {
  args: { reports: { items: [], total: 0 }, signedIn: false },
};
