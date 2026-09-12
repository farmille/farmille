import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialCard } from "@/components/MaterialCard";
import { css } from "../../../styled-system/css";
import { HomeMaterialMarquee } from "./HomeMaterialMarquee";

const thumbnail =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20450%22%3E%3Crect%20width%3D%22600%22%20height%3D%22450%22%20fill%3D%22%23dcefd8%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22225%22%20r%3D%22120%22%20fill%3D%22%23618d48%22%2F%3E%3C%2Fsvg%3E";

type MarqueeMaterial = {
  name: string;
  maker: string;
  rating: number;
  reviewCount: number;
  reportCount: number;
  savedCount: number;
  category: string;
  official: boolean;
};

const materials: MarqueeMaterial[] = [
  {
    name: "ツチイキル",
    maker: "グリーンバイオ株式会社",
    rating: 4.2,
    reviewCount: 128,
    reportCount: 12,
    savedCount: 64,
    category: "土壌改良",
    official: true,
  },
  {
    name: "根活バチルス",
    maker: "日本マイクロ農研",
    rating: 3.9,
    reviewCount: 86,
    reportCount: 8,
    savedCount: 41,
    category: "微生物資材",
    official: false,
  },
  {
    name: "菌根王 ハイパワー",
    maker: "みどり化成工業",
    rating: 4.5,
    reviewCount: 212,
    reportCount: 25,
    savedCount: 138,
    category: "菌根菌",
    official: true,
  },
  {
    name: "トリコデルマ PRO",
    maker: "西日本バイオテック",
    rating: 4.0,
    reviewCount: 47,
    reportCount: 5,
    savedCount: 22,
    category: "病害抑制",
    official: false,
  },
  {
    name: "海藻アミノ 有機一番",
    maker: "三陸水産資材",
    rating: 4.3,
    reviewCount: 154,
    reportCount: 18,
    savedCount: 90,
    category: "液肥",
    official: true,
  },
  {
    name: "フルボ酸パワーZ",
    maker: "北海道土壌研究所",
    rating: 3.7,
    reviewCount: 33,
    reportCount: 3,
    savedCount: 15,
    category: "腐植資材",
    official: false,
  },
  {
    name: "乳酸菌ブースト 5号",
    maker: "発酵技研",
    rating: 4.1,
    reviewCount: 61,
    reportCount: 7,
    savedCount: 38,
    category: "発酵資材",
    official: false,
  },
  {
    name: "ケイ酸リッチ 粒状",
    maker: "山陽鉱産",
    rating: 3.8,
    reviewCount: 19,
    reportCount: 2,
    savedCount: 9,
    category: "ミネラル",
    official: true,
  },
  {
    name: "土壌線虫ガード",
    maker: "アグリプロテクト",
    rating: 4.4,
    reviewCount: 98,
    reportCount: 11,
    savedCount: 57,
    category: "線虫対策",
    official: true,
  },
  {
    name: "光合成細菌 レッドソイル",
    maker: "九州微生物センター",
    rating: 4.6,
    reviewCount: 175,
    reportCount: 21,
    savedCount: 112,
    category: "微生物資材",
    official: false,
  },
  {
    name: "堆肥速成アクセル",
    maker: "東北コンポスト",
    rating: 3.6,
    reviewCount: 27,
    reportCount: 4,
    savedCount: 13,
    category: "堆肥化促進",
    official: false,
  },
  {
    name: "うまみ果実 カルシウム",
    maker: "信州果樹資材",
    rating: 4.2,
    reviewCount: 73,
    reportCount: 9,
    savedCount: 45,
    category: "葉面散布",
    official: true,
  },
  {
    name: "水稲根張り酵母",
    maker: "越後ライスラボ",
    rating: 4.0,
    reviewCount: 52,
    reportCount: 6,
    savedCount: 31,
    category: "水稲",
    official: false,
  },
  {
    name: "アゾト窒素固定ペレット",
    maker: "中部バイオ肥料",
    rating: 3.9,
    reviewCount: 41,
    reportCount: 5,
    savedCount: 24,
    category: "窒素固定",
    official: true,
  },
];

function materialCards(count: number) {
  return materials
    .slice(0, count)
    .map((material) => (
      <MaterialCard
        key={material.name}
        variant="scroll"
        name={material.name}
        maker={material.maker}
        rating={material.rating}
        reviewCount={material.reviewCount}
        articleCount={material.reportCount}
        savedCount={material.savedCount}
        categories={[material.category]}
        official={material.official}
        imageSrc={thumbnail}
        href={`/materials/${encodeURIComponent(material.name)}`}
      />
    ));
}

const meta = {
  title: "App/Home/MaterialMarquee",
  component: HomeMaterialMarquee,
  // ページコンテナと同じ左右余白を与え、フレームの負マージンを画面幅に収める。
  decorators: [
    (Story) => (
      <div className={css({ px: "4", tab: { px: "5" } })}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeMaterialMarquee>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: materialCards(14) },
};

export const Few: Story = {
  args: { children: materialCards(2) },
};
