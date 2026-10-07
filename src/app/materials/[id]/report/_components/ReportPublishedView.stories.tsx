import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportPublishedView } from "./ReportPublishedView";
import { filledReport } from "./reportStoryFixture";

const meta = {
  title: "App/Materials/Report/ReportPublishedView",
  component: ReportPublishedView,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: {
    input: filledReport,
    materialName: "土づくり微生物資材",
    manufacturerName: "グリーンバイオ株式会社",
    cropName: "トマト",
    onBack: fn(),
  },
} satisfies Meta<typeof ReportPublishedView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Filled: Story = {};
