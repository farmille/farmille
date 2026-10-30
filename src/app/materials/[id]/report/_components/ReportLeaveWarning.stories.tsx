import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../../styled-system/css";

import { ReportLeaveWarning } from "./ReportLeaveWarning";

const noteStyle = css({ color: "text.subtle", fontSize: "sm" });

const meta = {
  title: "Pages/materials/[id]/report/ReportLeaveWarning",
  component: ReportLeaveWarning,
  render: () => (
    <>
      <ReportLeaveWarning />
      <p className={noteStyle}>
        表示を持たず、表示している間は再読み込みやページを離れる操作の前に確認を出します。
      </p>
    </>
  ),
} satisfies Meta<typeof ReportLeaveWarning>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
