import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialLinks } from "./MaterialLinks";

const meta = {
  title: "Materials/Links",
  component: MaterialLinks,
  args: {
    links: [
      {
        group: "overview",
        title: "製品パンフレット",
        url: "https://example.com/product.pdf",
        trial: null,
      },
      {
        group: "public_trial",
        title: "トマトの生育に関する試験報告",
        url: "https://example.com/trial.pdf",
        trial: {
          crops: "トマト",
          summary: "処理区と無処理区の生育を比較した試験の概要です。",
          institution: "農業試験場",
          year: 2025,
          pageCount: 12,
        },
      },
      {
        group: "other_trial",
        title: "施用条件の比較試験",
        url: "https://example.com/other.pdf",
        trial: {
          crops: "",
          summary: "施用条件を変えて生育を比較した試験です。",
          institution: "メーカー研究所",
          year: null,
          pageCount: null,
        },
      },
    ],
  },
} satisfies Meta<typeof MaterialLinks>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Unclassified: Story = {
  args: {
    links: [{ group: null, title: "公開資料", url: "https://example.com/report.pdf", trial: null }],
  },
};
