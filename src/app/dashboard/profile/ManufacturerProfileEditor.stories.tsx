import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ManufacturerProfileEditor } from "./ManufacturerProfileEditor";
const meta = {
  title: "Manufacturer/ProfileEditor",
  component: ManufacturerProfileEditor,
  parameters: { nextjs: { appDirectory: true } },
  args: {
    sellerId: "33333333-3333-4333-8333-333333333333",
    name: "デモ株式会社",
    regionScope: null,
    initialContent: {
      profileText: "農業資材を開発するメーカーです。",
      logoUrl: "",
      websiteUrl: "https://example.com",
    },
    expectedVersion: null,
    pendingVersion: null,
  },
} satisfies Meta<typeof ManufacturerProfileEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
