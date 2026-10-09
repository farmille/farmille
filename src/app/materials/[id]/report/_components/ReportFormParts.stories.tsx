import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css, cx } from "../../../../../../styled-system/css";

import { GroupHeading, chipRecipe, chips, pillButtonRecipe, reportFrame } from "./ReportFormParts";

function PartsPreview() {
  return (
    <div>
      <GroupHeading title="栽培条件" note="どこで・どんな環境で育てているか" />
      <div className={cx(chips, css({ mt: "3" }))}>
        <button type="button" className={chipRecipe()}>
          樹勢改善
        </button>
        <button type="button" className={chipRecipe({ state: "on" })}>
          根張りの改善
        </button>
        <span className={chipRecipe({ state: "selected" })}>トマト</span>
        <button type="button" className={chipRecipe({ size: "sm" })}>
          ピーマン
        </button>
      </div>
      <div className={cx(chips, css({ mt: "3" }))}>
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
  title: "App/Materials/Report/ReportFormParts",
  component: GroupHeading,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: { title: "栽培条件", note: "どこで・どんな環境で育てているか" },
  render: () => <PartsPreview />,
} satisfies Meta<typeof GroupHeading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
