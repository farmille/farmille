import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../styled-system/css";

import { ReportCardChart } from "./ReportCardChart";
import { storyReportChart } from "./story-fixtures";

const meta = {
  title: "Pages/materials/[id]/ReportCardChart",
  component: ReportCardChart,
  decorators: [(Story) => <div className={css({ maxW: "64" })}>{Story()}</div>],
  args: { chart: storyReportChart },
} satisfies Meta<typeof ReportCardChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 3区目は青緑。単位が % のときは目盛りを100まで取る。 */
export const Percent: Story = {
  args: {
    chart: {
      title: "整粒歩合",
      unit: "%",
      rows: [
        { id: "a", label: "無処理区", valueText: "71.0", value: 71, error: null, colorIndex: 0 },
        { id: "b", label: "処理区A", valueText: "78.5", value: 78.5, error: null, colorIndex: 1 },
        { id: "c", label: "処理区B", valueText: "80.2", value: 80.2, error: null, colorIndex: 2 },
      ],
    },
  },
};
