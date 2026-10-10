import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { createBlankUsageReport } from "@/lib/usage-report";

import { ReportStepConditions } from "./ReportStepConditions";
import { reportFrame } from "./ReportFormParts";

const blank = createBlankUsageReport("00000000-0000-4000-8000-000000000101");

const meta = {
  title: "App/Materials/Report/ReportStepConditions",
  component: ReportStepConditions,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: {
    input: {
      ...blank,
      prefectureCode: 45,
      showCity: true,
      city: "宮崎市",
      cultivationEnvironment: "パイプハウスで土耕栽培。無加温。",
      timingStages: [1, 3],
      timingNote: "3月6日に定植。6月5日に施用。",
    },
    onChange: fn(),
    errors: {},
    registeredCity: "宮崎市",
  },
  render: function ConditionsStory(args) {
    const [input, setInput] = useState(args.input);
    return <ReportStepConditions {...args} input={input} onChange={setInput} />;
  },
} satisfies Meta<typeof ReportStepConditions>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Missing: Story = {
  args: {
    input: { ...blank, timingNote: "定植してすぐに施用" },
    errors: {
      prefectureCode: "都道府県を選んでください",
      cultivationEnvironment: "栽培環境を入力してください",
      timingStages: "施用時期の段階を選んでください",
    },
  },
};

// 施用時期を押すと aria-pressed で押した状態になり、前から押してあるものも残る
export const PressTiming: Story = {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    const pressed = canvas.getByRole("button", { name: "開花・生殖成長開始期" });
    await userEvent.click(pressed);
    await expect(pressed).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("button", { name: "播種・定植時" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};
