import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../../styled-system/css";

import { GroupHeading, pillButtonRecipe, reportFrame } from "./ReportFormParts";

function PartsPreview() {
  return (
    <div>
      <GroupHeading title="栽培条件" note="どこで・どんな環境で育てているか" />
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "2", mt: "3" })}>
        <button type="button" className={pillButtonRecipe({ strong: true })}>
          下書き保存
        </button>
        <button
          type="button"
          className={pillButtonRecipe({ tone: "quiet", size: "md", strong: true })}
        >
          戻る
        </button>
        <button
          type="button"
          className={pillButtonRecipe({ tone: "soft", size: "md", strong: true })}
        >
          ここまでで投稿
        </button>
        <button
          type="button"
          className={pillButtonRecipe({ tone: "primary", size: "md", strong: true })}
        >
          次へ
        </button>
        <button type="button" className={pillButtonRecipe({ tone: "dashed", strong: true })}>
          ＋ 別の調査項目のグラフを追加
        </button>
      </div>
    </div>
  );
}

const meta = {
  title: "Pages/materials/[id]/report/ReportFormParts",
  component: GroupHeading,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: { title: "栽培条件", note: "どこで・どんな環境で育てているか" },
  render: () => <PartsPreview />,
} satisfies Meta<typeof GroupHeading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
