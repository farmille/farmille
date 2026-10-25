import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportPdfReadingDialog } from "./ReportPdfReadingDialog";
import { filledReport } from "./reportStoryFixture";

const meta = {
  title: "Pages/materials/[id]/report/ReportPdfReadingDialog",
  component: ReportPdfReadingDialog,
  args: {
    onClose: fn(),
    defaultTrial: "",
    materialId: filledReport.materialId,
    userId: "00000000-0000-4000-8000-000000000001",
    siteKey: "storybook-site-key",
    remaining: 8,
    input: filledReport,
    replaces: false,
    onRead: fn(),
  },
} satisfies Meta<typeof ReportPdfReadingDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** レポートに作物と品種があるときは、読み取る試験の書き始めに入れておく。 */
export const TrialDraft: Story = { args: { defaultTrial: "トマト・桃太郎の" } };

/** 区か数値の調査項目に入力があり、読み取ると置き換わる。 */
export const Replaces: Story = { args: { replaces: true } };

/** 今月の回数を使い切った。 */
export const LimitReached: Story = { args: { remaining: 0 } };
