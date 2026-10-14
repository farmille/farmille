import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "../../articles/_components/story-frame";

import { ReportBars, ReportGraphNote } from "./ReportBars";

const meta = {
  title: "Pages/reports/[id]/ReportBars",
  component: ReportBars,
  decorators: [(Story) => readingFrame(Story())],
  args: {
    title: "可販果率",
    unit: "%",
    rows: [
      { id: "a", label: "対照区", valueText: "74", value: 74, error: null, colorIndex: 0 },
      { id: "b", label: "使用区", valueText: "82±3 a", value: 82, error: 3, colorIndex: 1 },
      {
        id: "c",
        label: "倍量区",
        valueText: "79.5±4.2 ab",
        value: 79.5,
        error: 4.2,
        colorIndex: 2,
      },
    ],
  },
} satisfies Meta<typeof ReportBars>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Percent: Story = {};
export const NegativeAndLongLabels: Story = {
  args: {
    title: "前年比の収量の増減",
    unit: "kg/10a",
    rows: [
      {
        id: "a",
        label: "とても長い名前の対照区（慣行施肥のみ）",
        valueText: "-120",
        value: -120,
        error: null,
        colorIndex: 0,
      },
      { id: "b", label: "使用区", valueText: "340±25", value: 340, error: 25, colorIndex: 1 },
    ],
  },
};
export const WithoutUnit: Story = {
  args: {
    title: "株数",
    unit: "",
    rows: [{ id: "a", label: "使用区", valueText: "12", value: 12, error: null, colorIndex: 3 }],
  },
};
export const WithNote: Story = {
  render: (args) => (
    <>
      <ReportBars {...args} />
      <ReportGraphNote>グラフは投稿されたデータからFarmilleが自動生成しています</ReportGraphNote>
    </>
  ),
};
