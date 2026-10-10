import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { createBlankUsageReport } from "@/lib/usage-report";

import { ReportStepResult } from "./ReportStepResult";
import { reportFrame } from "./ReportFormParts";

const blank = createBlankUsageReport("00000000-0000-4000-8000-000000000101");
const effects = [
  { id: "water", name: "水分吸収の改善", categoryName: "栄養利用の効率改善" },
  { id: "root", name: "根張りの改善", categoryName: "栄養利用の効率改善" },
  { id: "heat", name: "高温ストレスの軽減", categoryName: "ストレス耐性" },
  { id: "cold", name: "低温ストレスの軽減", categoryName: "ストレス耐性" },
];

const meta = {
  title: "App/Materials/Report/ReportStepResult",
  component: ReportStepResult,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: {
    input: {
      ...blank,
      observedChange: "2回目の使用から数日後、午後の葉の萎れが軽くなった。",
      purposeTags: ["根張りの改善"],
    },
    onChange: fn(),
    errors: {},
    effects,
    materialEffectNames: ["根張りの改善", "水分吸収の改善"],
  },
  render: function ResultStory(args) {
    const [input, setInput] = useState(args.input);
    return <ReportStepResult {...args} input={input} onChange={setInput} />;
  },
} satisfies Meta<typeof ReportStepResult>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AllEffects: Story = {
  args: {
    input: blank,
    materialEffectNames: [],
    errors: {
      observedChange: "結果・感想を入力してください",
      purposeTags: "使用目的を選んでください",
    },
  },
};

export const PressTag: Story = {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    const pressed = canvas.getByRole("button", { name: "水分吸収の改善" });
    await userEvent.click(pressed);
    await expect(pressed).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: "根張りの改善" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};
