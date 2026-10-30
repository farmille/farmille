import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";

import { ReportBars, ReportGraphNote } from "./ReportBars";

const frame = css({ maxW: "content.form", px: "4", py: "4" });

const meta = {
  title: "Pages/Shared/ReportBars",
  component: ReportBars,
  decorators: [
    (Story) => (
      <div className={frame}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "可販果率",
    unit: "%",
    groups: [
      {
        key: "all",
        heading: null,
        rows: [
          { id: "a", label: "対照区", valueText: "74", value: 74, error: null, series: "1" },
          { id: "b", label: "使用区", valueText: "82±3 a", value: 82, error: 3, series: "2" },
          {
            id: "c",
            label: "倍量区",
            valueText: "79.5±4.2 ab",
            value: 79.5,
            error: 4.2,
            series: "3",
          },
        ],
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
    groups: [
      {
        key: "all",
        heading: null,
        rows: [
          {
            id: "a",
            label: "とても長い名前の対照区（慣行施肥のみ）",
            valueText: "-120",
            value: -120,
            error: null,
            series: "1",
          },
          { id: "b", label: "使用区", valueText: "340±25", value: 340, error: 25, series: "2" },
        ],
      },
    ],
  },
};

export const WithoutUnit: Story = {
  args: {
    title: "株数",
    unit: "",
    groups: [
      {
        key: "all",
        heading: null,
        rows: [{ id: "a", label: "使用区", valueText: "12", value: 12, error: null, series: "4" }],
      },
    ],
  },
};

export const ByVariety: Story = {
  args: {
    title: "可販重量",
    unit: "g",
    legend: [
      { key: "untreated", label: "無処理", series: "1" },
      { key: "posted", label: "ヒートインパクト（投稿した資材）", series: "2" },
      { key: "compared", label: "ノビテク（比較した資材）", series: "3" },
    ],
    groups: ["新藍", "味珠"].map((variety, v) => ({
      key: variety,
      heading: variety,
      rows: [
        { name: "無処理", series: "1" as const, value: [856, 808][v] ?? 0 },
        { name: "ヒートインパクト", series: "2" as const, value: [1126, 1062][v] ?? 0 },
        { name: "ノビテク", series: "3" as const, value: [852, 968][v] ?? 0 },
      ].map(({ name, series, value }) => ({
        id: `${variety}-${name}`,
        label: `${variety}・${name}`,
        valueText: `${value.toLocaleString("ja-JP")}±120 A`,
        value,
        error: 120,
        series,
      })),
    })),
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
