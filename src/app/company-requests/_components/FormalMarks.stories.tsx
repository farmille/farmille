import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";

import { fieldLabelStyle } from "./formal-styles";
import { ConditionMark, LabelNote, OptionalMark, PrivateNote, RequiredMark } from "./FormalMarks";

function Marks() {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "3", p: "4" })}>
      <span className={fieldLabelStyle}>
        法人名 <RequiredMark />
      </span>
      <span className={fieldLabelStyle}>
        担当者名 <RequiredMark /> <PrivateNote />
      </span>
      <span className={fieldLabelStyle}>
        製品公式ページURL <OptionalMark />
      </span>
      <span className={fieldLabelStyle}>
        FarmilleページURL <ConditionMark>掲載済み資材の場合は必須</ConditionMark>
      </span>
      <span className={fieldLabelStyle}>
        申請内容 <RequiredMark /> <LabelNote>単一選択</LabelNote>
      </span>
    </div>
  );
}

const meta = {
  title: "CompanyApplications/FormalMarks",
  component: Marks,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
} satisfies Meta<typeof Marks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
