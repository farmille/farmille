import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { UsageReportEditorialDetail } from "@/server/admin/usage-reports";

import { UsageReportEditorialForm } from "./EditorialForm";

const report: UsageReportEditorialDetail = {
  formVersion: 1,
  structured: null,
  documentUrls: [],
  id: "00000000-0000-4000-8000-000000000501",
  title: "トマト定植後の根張りを比較",
  status: "pending",
  createdAt: "2026-08-01T00:00:00.000Z",
  publishedAt: null,
  purposeTags: ["発根促進"],
  purposeNote: null,
  prefectureCode: 1,
  fieldName: "第2ハウス",
  variety: "桃太郎",
  plantingDate: "2026-04-15",
  cultivationType: "施設栽培",
  cultivationTags: ["養液土耕"],
  growthStage: "定植期",
  climateNote: "平年より低温",
  observedChange: "処理区では細根が増え、初期生育がそろいました。",
  negativeNote: "散布直後は特有のにおいがありました。",
  summary: "低温期の定植で根張りの改善を確認しました。",
  editorNote: "数値と写真の対応を確認済み。",
  author: { userId: "user-storybook", handle: "北のトマト農家" },
  crop: { id: "crop-tomato", name: "トマト" },
  material: { id: "material-storybook", name: "土づくり微生物資材" },
  applications: [],
  media: [],
  metrics: [],
};

const meta = {
  title: "App/Admin/UsageReports/EditorialForm",
  component: UsageReportEditorialForm,
  args: { report },
} satisfies Meta<typeof UsageReportEditorialForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const Published: Story = {
  args: { report: { ...report, status: "published", publishedAt: "2026-08-09T00:00:00.000Z" } },
};

export const StructuredReport: Story = {
  args: { report: { ...report, formVersion: 2 } },
};
