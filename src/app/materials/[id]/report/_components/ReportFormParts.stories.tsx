import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge, Example, GroupHeading, Need, reportFrame } from "./ReportFormParts";

function PartsPreview() {
  return (
    <div>
      <GroupHeading title="栽培条件" note="どこで・どんな環境で育てているか" />
      <p>
        使用作物 <Badge required /> <Badge />
        <Need message="使用作物を選んでください" />
      </p>
      <Need block message="品種を入力するか、「品種が不明」にチェックしてください" />
      <Example>・アイコ</Example>
      <Example compact>〇〇は使っていない。かん水と施肥は処理区と同じ。</Example>
    </div>
  );
}

const meta = {
  title: "App/Materials/Report/ReportFormParts",
  component: Badge,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  render: () => <PartsPreview />,
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
