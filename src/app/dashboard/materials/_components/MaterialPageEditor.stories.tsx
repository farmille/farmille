import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialPageEditor } from "./MaterialPageEditor";

const meta = {
  title: "Pages/dashboard/materials/MaterialPageEditor",
  component: MaterialPageEditor,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    materialId: "11111111-1111-4111-8111-111111111111",
    initialContent: {
      description: "製品の特徴と使用時の注意事項を記載しています。",
      mainComponents: "海藻抽出物",
      mechanism: "製品資料をご参照ください。",
      links: [
        { trial: null, group: "overview", title: "製品資料", url: "https://example.com/product" },
      ],
      images: [],
      usages: [{ method: "spray", detail: "希釈倍率と施用量は製品ラベルをご確認ください。" }],
      timings: [1, 3],
      registrations: [],
      relatedCompanies: [],
      certifications: ["登録情報は製品ラベルをご確認ください"],
    },
    expectedVersion: null,
    pendingVersion: null,
    imageUrl: "/images/container-shapes/5.png",
  },
} satisfies Meta<typeof MaterialPageEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TrialAndRegistration: Story = {
  args: {
    initialContent: {
      ...meta.args.initialContent,
      links: [
        {
          group: "public_trial",
          title: "県試験場の試験報告",
          url: "https://example.com/trial.pdf",
          trial: {
            crops: "トマト",
            summary: "高温期の着果率を比較しました。",
            institution: "県農業試験場",
            year: 2025,
            pageCount: 12,
          },
        },
      ],
      registrations: [{ kind: "pesticide", companyName: "農薬登録会社", effects: "" }],
      relatedCompanies: ["製造会社"],
    },
  },
};

export const Pending: Story = {
  args: { pendingVersion: "22222222-2222-4222-8222-222222222222" },
};
