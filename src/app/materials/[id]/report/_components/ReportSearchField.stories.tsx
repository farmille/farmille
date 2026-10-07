import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { ReportSearchField } from "./ReportSearchField";
import { reportFrame } from "./ReportFormParts";

const meta = {
  title: "App/Materials/Report/ReportSearchField",
  component: ReportSearchField,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: {
    ariaLabel: "作目",
    placeholder: "作物名で検索　例）トマト、みかん",
    value: "トマ",
    onValueChange: fn(),
    items: [
      { value: "tomato", label: "トマト なす科果菜類", name: "トマト", category: "なす科果菜類" },
      {
        value: "mini",
        label: "ミニトマト なす科果菜類",
        name: "トマト",
        category: "なす科果菜類",
        note: "別名: ミニトマト",
      },
    ],
    emptyMessage: "見つかりません。",
    onSelect: fn(),
  },
  render: function SearchStory(args) {
    const [value, setValue] = useState(args.value);
    return <ReportSearchField {...args} value={value} onValueChange={setValue} />;
  },
} satisfies Meta<typeof ReportSearchField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { value: "" } };
