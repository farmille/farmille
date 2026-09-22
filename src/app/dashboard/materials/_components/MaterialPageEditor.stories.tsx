import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialPageEditor } from "./MaterialPageEditor";
const meta = {
  title: "Manufacturer/MaterialPageEditor",
  component: MaterialPageEditor,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    materialId: "11111111-1111-4111-8111-111111111111",
    sellerId: "33333333-3333-4333-8333-333333333333",
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
    initialImageSources: [],
  },
} satisfies Meta<typeof MaterialPageEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
