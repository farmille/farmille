import type { HelpfulItem, OwnPostItem } from "@/server/queries/me-page";
import type { OwnProfile } from "@/server/queries/profiles";
import type { CompareMaterialItem, SavedMaterialItem } from "@/server/queries/saved-materials";

export const ownProfile = {
  userId: "00000000-0000-4000-8000-000000000301",
  handle: "緑の畑",
  avatarUrl: null,
} satisfies OwnProfile;

export const ownPosts = [
  {
    kind: "review",
    id: "review-1",
    createdAt: "2026-08-01T09:00:00.000Z",
    materialId: "material-1",
    materialName: "土づくり微生物資材",
    cropName: "トマト",
    rating: 4,
    body: "定植前に使いました。根張りが安定し、潅水後の立ち上がりも良好でした。",
    helpfulCount: 12,
  },
  {
    kind: "usage_report",
    id: "report-1",
    createdAt: "2026-07-28T09:00:00.000Z",
    materialId: "material-2",
    title: "夏作トマトでの使用記録",
    cropName: "トマト",
    status: "published",
    helpfulCount: 7,
  },
  {
    kind: "usage_report",
    id: "report-2",
    createdAt: "2026-07-20T09:00:00.000Z",
    materialId: "material-3",
    title: "ほうれん草の播種前処理",
    cropName: "ほうれん草",
    status: "draft",
    helpfulCount: 0,
  },
] satisfies OwnPostItem[];

export const savedMaterials = [
  {
    savedId: "saved-1",
    savedAt: "2026-08-03T09:00:00.000Z",
    materialId: "material-1",
    name: "土づくり微生物資材",
    manufacturerName: "グリーンバイオ株式会社",
    genre: "微生物資材",
    priceRange: "5,000〜8,000円",
    reviewCount: 18,
    avgRating: 4.3,
    controlPlotRatio: 0.64,
    official: true,
    description: "土壌環境を整えるための微生物資材です。",
    primaryImageUrl: null,
  },
  {
    savedId: "saved-2",
    savedAt: "2026-08-02T09:00:00.000Z",
    materialId: "material-2",
    name: "根圏サポートA",
    manufacturerName: "ファーム技研",
    genre: "バイオスティミュラント",
    priceRange: "3,000〜5,000円",
    reviewCount: 9,
    avgRating: 3.8,
    controlPlotRatio: null,
    official: false,
    description: null,
    primaryImageUrl: null,
  },
  {
    savedId: "saved-3",
    savedAt: "2026-07-30T09:00:00.000Z",
    materialId: "material-3",
    name: "葉面活力プラス",
    manufacturerName: "みのり資材株式会社",
    genre: "葉面散布材",
    priceRange: null,
    reviewCount: 3,
    avgRating: null,
    controlPlotRatio: 0.5,
    official: true,
    description: "生育中期の葉面散布に使う資材です。",
    primaryImageUrl: null,
  },
] satisfies SavedMaterialItem[];

export const compareMaterials = savedMaterials.map(
  ({
    materialId: id,
    savedId: _savedId,
    savedAt: _savedAt,
    official: _official,
    description: _description,
    primaryImageUrl: _primaryImageUrl,
    ...material
  }) => ({
    id,
    ...material,
    tags:
      material.genre === null
        ? []
        : [{ id: `${id}-type`, name: material.genre, category: "genre" }],
  }),
) satisfies CompareMaterialItem[];

export const helpfulItems = [
  {
    kind: "review",
    id: "helpful-review-1",
    materialId: "material-4",
    materialName: "土壌コンディショナーB",
    cropName: "きゅうり",
    rating: 5,
    body: "対照区と比べて初期生育が揃いました。散布条件も書いておきます。",
    author: {
      name: "北のきゅうり農家",
      avatarUrl: null,
      label: "",
      href: "/users/00000000-0000-4000-8000-000000000302",
    },
    helpfulCount: 24,
    votedAt: "2026-08-04T09:00:00.000Z",
  },
  {
    kind: "usage_report",
    id: "helpful-report-1",
    title: "露地キャベツでの比較試験",
    cropName: "キャベツ",
    author: { name: "退会済みユーザー", avatarUrl: null, label: "", href: null },
    helpfulCount: 31,
    votedAt: "2026-08-02T09:00:00.000Z",
  },
] satisfies HelpfulItem[];
