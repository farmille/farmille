import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialCard, type MaterialGenre } from "@/components/MaterialCard";
import { css } from "../../../styled-system/css";
import { HomeMaterialMarquee } from "./HomeMaterialMarquee";

const thumbnail =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20450%22%3E%3Crect%20width%3D%22600%22%20height%3D%22450%22%20fill%3D%22%23dcefd8%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22225%22%20r%3D%22120%22%20fill%3D%22%23618d48%22%2F%3E%3C%2Fsvg%3E";

const genres = [
  { name: "海藻、海藻抽出物", short_name: "海藻" },
  { name: "アミノ酸、ペプチド、タンパク質加水分解物", short_name: "アミノ酸" },
  { name: "腐植酸、腐植物質、フミン酸、フルボ酸", short_name: "フルボ酸・腐植酸" },
  { name: "微生物", short_name: "微生物" },
  { name: "微量ミネラル、ビタミン", short_name: "微量ミネラル" },
  { name: "キチン、キトサン、多糖類", short_name: "キチン・多糖類" },
  { name: "動植物抽出物、微生物抽出物", short_name: "動植物・微生物抽出物" },
  { name: "その他", short_name: "その他" },
] satisfies MaterialGenre[];

type MarqueeMaterial = {
  name: string;
  maker: string;
  rating: number;
  reviewCount: number;
  genre: MaterialGenre;
};

const materials: MarqueeMaterial[] = [
  {
    name: "ツチイキル",
    maker: "グリーンバイオ株式会社",
    rating: 4.2,
    reviewCount: 128,
    genre: genres[0],
  },
  {
    name: "根活バチルス",
    maker: "日本マイクロ農研",
    rating: 3.9,
    reviewCount: 86,
    genre: genres[1],
  },
  {
    name: "菌根王 ハイパワー",
    maker: "みどり化成工業",
    rating: 4.5,
    reviewCount: 212,
    genre: genres[2],
  },
  {
    name: "トリコデルマ PRO",
    maker: "西日本バイオテック",
    rating: 4.0,
    reviewCount: 47,
    genre: genres[3],
  },
  {
    name: "海藻アミノ 有機一番",
    maker: "三陸水産資材",
    rating: 4.3,
    reviewCount: 154,
    genre: genres[4],
  },
  {
    name: "フルボ酸パワーZ",
    maker: "北海道土壌研究所",
    rating: 3.7,
    reviewCount: 33,
    genre: genres[5],
  },
  {
    name: "乳酸菌ブースト 5号",
    maker: "発酵技研",
    rating: 4.1,
    reviewCount: 61,
    genre: genres[6],
  },
  {
    name: "ケイ酸リッチ 粒状",
    maker: "山陽鉱産",
    rating: 3.8,
    reviewCount: 19,
    genre: genres[7],
  },
  {
    name: "土壌線虫ガード",
    maker: "アグリプロテクト",
    rating: 4.4,
    reviewCount: 98,
    genre: genres[0],
  },
  {
    name: "光合成細菌 レッドソイル",
    maker: "九州微生物センター",
    rating: 4.6,
    reviewCount: 175,
    genre: genres[1],
  },
  {
    name: "堆肥速成アクセル",
    maker: "東北コンポスト",
    rating: 3.6,
    reviewCount: 27,
    genre: genres[2],
  },
  {
    name: "うまみ果実 カルシウム",
    maker: "信州果樹資材",
    rating: 4.2,
    reviewCount: 73,
    genre: genres[3],
  },
  {
    name: "水稲根張り酵母",
    maker: "越後ライスラボ",
    rating: 4.0,
    reviewCount: 52,
    genre: genres[4],
  },
  {
    name: "アゾト窒素固定ペレット",
    maker: "中部バイオ肥料",
    rating: 3.9,
    reviewCount: 41,
    genre: genres[5],
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
        categories={[material.genre]}
        imageSrc={thumbnail}
        href={`/materials/${encodeURIComponent(material.name)}`}
      />
    ));
}

const meta = {
  title: "Pages/Home/HomeMaterialMarquee",
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
