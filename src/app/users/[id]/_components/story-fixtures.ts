import type { PublicProfilePageData, PublicProfilePost } from "@/server/queries/public-profiles";

export const publicProfile = {
  userId: "00000000-0000-4000-8000-000000000301",
  handle: "緑の畑",
  avatarUrl: null,
  bio: "東京都でトマトと葉物野菜を育てています。試した資材の条件と結果を記録しています。",
  cultivationStyles: ["施設園芸", "土耕栽培"],
  affiliation: "東村山生産組合",
  websiteUrl: "https://example.com/farm",
  snsUrl: "https://example.com/farm/social",
  prefectureCode: 13,
  crops: [
    { id: "crop-tomato", name: "トマト" },
    { id: "crop-spinach", name: "ほうれん草" },
  ],
} satisfies PublicProfilePageData["profile"];

export const publicPosts = [
  {
    kind: "review",
    id: "review-1",
    createdAt: "2026-08-01T09:00:00.000Z",
    materialId: "material-1",
    materialName: "土づくり微生物資材",
    cropName: "トマト",
    rating: 4,
    body: "定植前に使用しました。対照区より根の張りが揃い、その後の生育も安定しました。",
    helpfulCount: 12,
    helpfulVotedByViewer: true,
    photos: [],
  },
  {
    kind: "usage_report",
    id: "report-1",
    createdAt: "2026-07-28T09:00:00.000Z",
    title: "夏作トマトでの使用記録",
    cropName: "トマト",
    helpfulCount: 7,
    coverUrl: null,
  },
] satisfies PublicProfilePost[];
