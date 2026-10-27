import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialCard } from "./MaterialCard";

const loadedImageUrl =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20450%22%3E%3Crect%20width%3D%22600%22%20height%3D%22450%22%20fill%3D%22%23dcefd8%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22225%22%20r%3D%22120%22%20fill%3D%22%23618d48%22%2F%3E%3C%2Fsvg%3E";

const material = {
  href: "/materials/1",
  name: "バチルス菌体資材 ツチイキル",
  maker: "グリーンバイオ株式会社",
  rating: 4.2,
} as const;

const longName = {
  name: "光合成細菌・バチルス菌・トリコデルマ菌を配合した土壌改良用複合微生物資材 ツチイキルプレミアム 業務用20kg",
  maker: "土壌微生物と持続可能な農業を研究するグリーンバイオ株式会社",
  description:
    "納豆菌群の働きで土壌の団粒化を促し、施設野菜の連作障害を軽減する微生物資材。定植前の土づくりから生育中の管理まで使えます。",
};

const rich = {
  ...material,
  variant: "rich",
  reviewCount: 18,
  reportCount: 4,
  savedCount: 27,
  description:
    "定植前の土壌に混和して使う微生物資材。根の伸長を促し、活着を早める。トマト・きゅうりなど果菜類の育苗期から使える。",
  categories: [
    { name: "微生物", short_name: "微生物" },
    { name: "アミノ酸、ペプチド、タンパク質加水分解物", short_name: "アミノ酸" },
    { name: "腐植酸、腐植物質、フミン酸、フルボ酸", short_name: "フルボ酸・腐植酸" },
  ],
  evidence: { direct: ["トマト"], groups: [] },
} as const;

const meta = {
  title: "Pages/Shared/MaterialCard",
  component: MaterialCard,
} satisfies Meta<typeof MaterialCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  args: {
    ...material,
    variant: "list",
    reviewCount: 128,
    description: "納豆菌群の力で土壌の団粒化を促進し、連作障害を軽減する微生物資材。",
  },
};

export const ListWithoutReviews: Story = {
  args: { ...material, variant: "list", rating: null },
};

export const ListImageLoaded: Story = {
  args: { ...material, variant: "list", imageSrc: loadedImageUrl },
};

export const ListImageFailure: Story = {
  args: { ...material, variant: "list", imageSrc: "/missing-material-image.png" },
};

export const ListLongName: Story = {
  args: { ...material, ...longName, variant: "list", reviewCount: 128 },
};

export const Rich: Story = {
  args: { ...rich, imageSrc: loadedImageUrl },
};

export const RichSparse: Story = {
  args: {
    ...rich,
    rating: null,
    reviewCount: 0,
    reportCount: 0,
    savedCount: 0,
    description: undefined,
    categories: [],
    evidence: { direct: [], groups: ["果菜類"] },
  },
};

export const RichLongName: Story = {
  args: { ...rich, ...longName },
};

export const Scroll: Story = {
  args: { ...material, variant: "scroll", reviewCount: 128 },
};

export const ScrollImageLoaded: Story = {
  args: { ...material, variant: "scroll", reviewCount: 128, imageSrc: loadedImageUrl },
};

export const ScrollImageFailure: Story = {
  args: {
    ...material,
    variant: "scroll",
    reviewCount: 128,
    imageSrc: "/missing-material-image.png",
  },
};
