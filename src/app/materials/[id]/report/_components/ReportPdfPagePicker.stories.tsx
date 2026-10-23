import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportPdfPagePicker } from "./ReportPdfPagePicker";

// PDF を開いていないときは何も出さない（PDF を開いた状態は実画面で確かめる）
const meta = {
  title: "Pages/materials/[id]/report/ReportPdfPagePicker",
  component: ReportPdfPagePicker,
  args: { doc: null, name: "試験成績書.pdf", onPick: fn(), onCancel: fn() },
} satisfies Meta<typeof ReportPdfPagePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
