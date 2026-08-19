import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportSubmitted } from "./ReportSubmitted";

const reports = [
  {
    id: "00000000-0000-4000-8000-000000001001",
    cropName: "トマト",
    status: "pending" as const,
    updatedAt: "2026-08-09T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000001002",
    cropName: "ピーマン",
    status: "pending" as const,
    updatedAt: "2026-08-09T00:00:00.000Z",
  },
];

const meta = {
  title: "App/Materials/Report/ReportSubmitted",
  component: ReportSubmitted,
  args: {
    materialId: "00000000-0000-4000-8000-000000000101",
    reports,
    justSubmitted: true,
  },
} satisfies Meta<typeof ReportSubmitted>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JustSubmitted: Story = {};

export const AlreadySubmitted: Story = {
  args: { justSubmitted: false },
};
