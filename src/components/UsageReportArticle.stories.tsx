import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createBlankUsageReport } from "@/lib/usage-report";
import { UsageReportArticle } from "./UsageReportArticle";
const input = createBlankUsageReport("11111111-1111-4111-8111-111111111111");
input.observedChange = "処理区では葉の萎れが少なくなりました。収量には明確な差がありませんでした。";
input.plots = input.plots.map((plot, index) => ({
  ...plot,
  name: index === 0 ? "無処理区" : "処理区",
  scope: "30株",
  description: index === 0 ? "資材なし" : "1,000倍に希釈して散布",
}));
input.measurements = input.measurements.map((measurement) => ({
  ...measurement,
  name: "切り花本数",
  unit: "本",
  graphs: measurement.graphs.map((graph) => ({
    ...graph,
    rows: graph.rows.map((row, index) => ({
      ...row,
      value: index === 0 ? "40.2±0.9" : "41.7±0.8 n.s.",
    })),
  })),
}));
const meta = {
  title: "Components/UsageReportArticle",
  component: UsageReportArticle,
  args: { input },
} satisfies Meta<typeof UsageReportArticle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Article: Story = {};
