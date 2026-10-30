import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArtMini } from "./ArtMini";

const sampleImage =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="104"><rect width="140" height="104" fill="#E8F5E9"/><circle cx="70" cy="52" r="30" fill="#2E7D32"/></svg>',
  );

const meta = {
  title: "Components/Display/ArtMini",
  component: ArtMini,
  args: {
    title: "土壌診断から始める減農薬栽培",
    organization: "グリーンバイオ株式会社",
    typeLabel: "メーカー",
  },
} satisfies Meta<typeof ArtMini>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithThumbnail: Story = {
  args: {
    thumbSrc: sampleImage,
  },
};

export const NotOfficial: Story = {
  args: {
    official: false,
    organization: "農家サポート研究会",
    typeLabel: "その他",
  },
};

export const JaOrganization: Story = {
  args: {
    organization: "〇〇バイオ株式会社",
    typeLabel: "メーカー",
  },
};

export const LongTitle: Story = {
  args: {
    title: "光合成細菌とバチルス菌を組み合わせた土壌改良の実践事例と施用量の目安について詳しく解説",
    thumbSrc: sampleImage,
  },
};
