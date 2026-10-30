import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ManufacturerProfileEditor } from "./ManufacturerProfileEditor";

const sampleLogo =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#E8F5E9"/><circle cx="48" cy="48" r="28" fill="#2E7D32"/></svg>`,
  );

const meta = {
  title: "Pages/dashboard/profile/ManufacturerProfileEditor",
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

export const DraftWithLogo: Story = {
  args: {
    initialContent: {
      profileText:
        "1978年の創業以来、土壌微生物の研究をもとにした資材を開発しています。北海道から沖縄まで、全国の生産者と試験圃場で効果を確かめながら製品を改良しています。",
      logoUrl: sampleLogo,
      websiteUrl: "https://example.com/company",
    },
    expectedVersion: "44444444-4444-4444-8444-444444444441",
  },
};

export const Pending: Story = {
  args: { pendingVersion: "44444444-4444-4444-8444-444444444442" },
};
