import type { RecentReviewItem } from "@/server/queries/reviews";
import type { RecentUsageReportItem } from "@/server/queries/usage-reports";

import type { HeroSearchOptions } from "./home-hero-options";
import type { HomeMaterialCardProps } from "./HomeMaterialCard";
import type { VoiceMaterial } from "./HomeVoices";

export const storyThumbnail =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20450%22%3E%3Crect%20width%3D%22600%22%20height%3D%22450%22%20fill%3D%22%23dcefd8%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22225%22%20r%3D%22120%22%20fill%3D%22%23618d48%22%2F%3E%3C%2Fsvg%3E";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const heroSearchOptions: HeroSearchOptions = {
  materials: [
    { id: id(1), name: "ツチイキル", maker: "グリーンバイオ株式会社", imageUrl: storyThumbnail },
    { id: id(2), name: "根活バチルス", maker: "日本マイクロ農研", imageUrl: null },
    { id: id(3), name: "根張りエース", maker: "みどり化成工業", imageUrl: storyThumbnail },
  ],
  pills: {
    crop: [
      { label: "トマト", count: 12, href: "/search?filters=crop" },
      { label: "水稲", count: 9, href: "/search?filters=rice" },
      { label: "いちご", count: 4, href: "/search?filters=strawberry" },
    ],
    effect: [
      { label: "養分吸収の改善", count: 15, href: "/search?filters=effect1" },
      { label: "耐暑性改善", count: 6, href: "/search?filters=effect2" },
    ],
    genre: [{ label: "微生物資材", count: 11, href: "/search?filters=genre" }],
    maker: [{ label: "グリーンバイオ株式会社", count: 3, href: "/search?filters=maker" }],
  },
};

export const homeMaterials: HomeMaterialCardProps[] = [
  {
    href: "/materials/1",
    name: "ツチイキル",
    maker: "グリーンバイオ株式会社",
    rating: 4.2,
    reviewCount: 128,
    reportCount: 3,
    savedCount: 41,
    categories: ["微生物資材", "土壌改良"],
    imageSrc: storyThumbnail,
  },
  {
    href: "/materials/2",
    name: "海藻アミノ 有機一番 プレミアム液肥 1000倍希釈タイプ",
    maker: "三陸水産資材株式会社 アグリ事業部",
    rating: null,
    reviewCount: 0,
    reportCount: 0,
    savedCount: 2,
    categories: ["海藻・海藻抽出物", "アミノ酸・ペプチド", "腐植質・有機酸"],
    imageSrc: null,
  },
  {
    href: "/materials/3",
    name: "根活バチルス",
    maker: "日本マイクロ農研",
    rating: 3.9,
    reviewCount: 86,
    reportCount: null,
    savedCount: null,
    categories: ["微生物資材"],
    imageSrc: storyThumbnail,
  },
];

const voiceMaterials: VoiceMaterial[] = [
  { id: id(1), name: "ツチイキル", maker: "グリーンバイオ株式会社", imageUrl: storyThumbnail },
  {
    id: id(2),
    name: "海藻アミノ 有機一番 プレミアム液肥 1000倍希釈タイプ",
    maker: "三陸水産資材株式会社 アグリ事業部",
    imageUrl: null,
  },
];

const report = (n: number, overrides: Partial<RecentUsageReportItem> = {}) => ({
  report: {
    id: id(100 + n),
    title: "定植前の土壌処理で根張りを比較",
    publishedAt: "2026-09-12T09:00:00+09:00",
    helpfulCount: 8,
    coverUrl: storyThumbnail,
    authorHandle: "ミニトマト農家",
    authorUserId: id(200 + n),
    cropName: "トマト",
    materialName: "ツチイキル",
    materialId: id(1),
    summary: "処理区は定植2週間後の根量が多く、活着のばらつきも小さかった。",
    ...overrides,
  },
  material: voiceMaterials[n % 2],
});

const review = (n: number, overrides: Partial<RecentReviewItem> = {}) => ({
  review: {
    id: id(300 + n),
    material_id: id(1),
    author_user_id: id(400 + n),
    rating: 4,
    body: "育苗期から使っています。根の張りが良くなり、定植後のしおれが減りました。",
    is_provided_sample: false,
    created_at: "2026-09-20T10:00:00+09:00",
    author: {
      user_id: id(400 + n),
      handle: "いちご生産者",
      avatar_url: null,
      standpoint: "farmer",
      prefecture_code: null,
    },
    crops: [{ id: id(500), name: "いちご" }],
    photos: [],
    helpfulCount: 3,
    helpfulVotedByViewer: false,
    materialName: "ツチイキル",
    ...overrides,
  },
  material: voiceMaterials[n % 2],
});

export const homeVoiceReports = [
  report(0),
  report(1, {
    title: "収穫期まで続けた葉面散布で、秀品率と糖度の推移を3作にわたって記録",
    coverUrl: null,
    summary:
      "3作続けて葉面散布し、対照区と比べた。秀品率は毎作上がったが、糖度の差は作によってばらついた。散布の時期と回数の記録も添える。",
  }),
  report(2, { authorHandle: "とても長いハンドルネームの水稲生産者さん", cropName: "水稲" }),
];

export const homeVoiceReviews = [
  review(0),
  review(1, {
    rating: 2,
    body: "効果ははっきりしませんでした。散布の手間が増えたわりに、収量の差は誤差の範囲です。土壌の条件が合わなかったのかもしれないので、来季は施用時期を変えて試します。希釈倍率も見直す予定です。",
    crops: [],
    author: null,
  }),
  review(2, { rating: 5 }),
  review(3, {
    rating: 3,
    crops: [
      { id: id(501), name: "水稲" },
      { id: id(502), name: "小麦" },
    ],
  }),
];
