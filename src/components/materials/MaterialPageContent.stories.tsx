import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialPageContent } from "./MaterialPageContent";
const meta = {
  title: "Materials/PageContent",
  component: MaterialPageContent,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    content: {
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
    imageSources: [],
  },
} satisfies Meta<typeof MaterialPageContent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
