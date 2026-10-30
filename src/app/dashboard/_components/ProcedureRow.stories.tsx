import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProcedureRow } from "./ProcedureRow";

const meta = {
  title: "Pages/dashboard/ProcedureRow",
  component: ProcedureRow,
  args: {
    heading: "h3",
    title: "製品情報の管理",
    href: "/dashboard/materials",
    actionLabel: "資材管理を開く",
    children:
      "資材オーナー権限のある製品情報の編集、下書き保存、プレビュー、表現確認の状況確認を行います。",
  },
} satisfies Meta<typeof ProcedureRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongDescription: Story = {
  args: {
    heading: "h2",
    title: "別の会社から資材の事業を引き継いだ",
    actionLabel: "申請フォーム C",
    children:
      "事業譲渡・合併などで資材を引き継いだ会社からの申請。現在の資材オーナー企業に通知し、14日間の確認期間を経て対応します。",
  },
};
