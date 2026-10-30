import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MetricBars, type MetricBarItem } from "./MetricBars";

const fewMetrics: MetricBarItem[] = [
  { id: "yield", metricName: "収量（kg/10a）", treatedValue: 620, untreatedValue: 480, unit: null },
  { id: "brix", metricName: "糖度（Brix）", treatedValue: 8.5, untreatedValue: 7.2, unit: null },
];

const manyMetrics: MetricBarItem[] = [
  { id: "yield", metricName: "収量", treatedValue: 620, untreatedValue: 480, unit: "kg/10a" },
  { id: "brix", metricName: "糖度", treatedValue: 8.5, untreatedValue: 7.2, unit: "Brix" },
  { id: "disease", metricName: "病害発生株数", treatedValue: 3, untreatedValue: 12, unit: "株" },
  { id: "height", metricName: "草丈", treatedValue: 142, untreatedValue: 128, unit: "cm" },
  {
    id: "leafcolor",
    metricName: "葉色（SPAD値）",
    treatedValue: 41.3,
    untreatedValue: 36.8,
    unit: null,
  },
  { id: "root", metricName: "根張り評点", treatedValue: 4.2, untreatedValue: 3.1, unit: "点" },
];

const meta = {
  title: "Components/Display/MetricBars",
  component: MetricBars,
  args: {
    metrics: fewMetrics,
  },
} satisfies Meta<typeof MetricBars>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Few: Story = {};

export const Many: Story = {
  args: {
    metrics: manyMetrics,
  },
};

export const PartialData: Story = {
  args: {
    metrics: [
      {
        id: "yield",
        metricName: "収量（kg/10a）",
        treatedValue: 620,
        untreatedValue: null,
        unit: null,
      },
      {
        id: "brix",
        metricName: "糖度（Brix）",
        treatedValue: null,
        untreatedValue: 7.2,
        unit: null,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    metrics: [],
  },
};
