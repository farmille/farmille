import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialReportsView } from "./MaterialReportsSection";
import { materialDetail, materialReports, storyReportDetail } from "./story-fixtures";

const meta = {
  title: "Pages/materials/[id]/MaterialReportsSection",
  component: MaterialReportsView,
  args: {
    material: materialDetail,
    reports: { items: materialReports, total: 5 },
    articleTotal: 0,
    signedIn: true,
    details: new Map(materialReports.map((report) => [report.id, storyReportDetail])),
  },
} satisfies Meta<typeof MaterialReportsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const SignedOutWithArticles: Story = {
  args: { signedIn: false, articleTotal: 2, details: null },
};

export const Empty: Story = {
  args: { reports: { items: [], total: 0 }, signedIn: false, details: null },
};

/** グラフにできる測定がないレポートでも、会員には都道府県を出す。 */
export const SignedInWithoutChart: Story = {
  args: {
    details: new Map(
      materialReports.map((report) => [report.id, { chart: null, prefecture: "熊本県" }]),
    ),
  },
};
