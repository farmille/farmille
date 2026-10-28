import type { MaterialPageContent } from "@/lib/material-page-editor";
import type { PublishedUsageReport } from "@/server/queries/material-content";
import type {
  MaterialDetail,
  MaterialEvidence,
  MaterialListItem,
} from "@/server/queries/materials";
import type { ReviewListItem } from "@/server/queries/reviews";

export const materialEvidence: MaterialEvidence[] = [
  {
    id: "00000000-0000-4000-8000-000000000701",
    evidence_type: "sds",
    title: "2026年版 安全データシート",
    file_url: null,
    external_url: "https://example.com/sds.pdf",
    meta: null,
    sort_order: 10,
    created_at: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000702",
    evidence_type: "trial",
    title: "トマト栽培試験結果",
    file_url: "https://example.com/trial.pdf",
    external_url: null,
    meta: null,
    sort_order: 20,
    created_at: "2026-07-01T00:00:00.000Z",
  },
];

export const materialDetail: MaterialDetail = {
  representativeSeller: {
    id: "00000000-0000-4000-8000-000000000201",
    official_name: "グリーンバイオ株式会社",
  },
  id: "00000000-0000-4000-8000-000000000101",
  name: "土づくり微生物資材",
  manufacturer_name: "グリーンバイオ株式会社",
  composition_type_id: "00000000-0000-4000-8000-000000000301",
  sales_status: "販売中",
  seller_id: "00000000-0000-4000-8000-000000000201",
  publication_status: "published",
  archived_at: null,
  manufacturer_verified_at: "2026-07-02T00:00:00.000Z",
  manufacturer_verification_method: "confirmed_existing",
  review_count: 18,
  avg_rating: 4.2,
  control_plot_ratio: 0.72,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
  description: "土壌環境を整え、定植後の根張りを支える微生物資材です。",
  general_use: "定植前の土づくりに使用します。",
  main_components: "バチルス属菌",
  mechanism: "有用微生物の定着を支援します。",
  usage_text: "10aあたり1kgを均一に散布します。",
  price_range: "5,000〜8,000円",
  official_url: "https://example.com/material",
  catalog_url: "https://example.com/catalog.pdf",
  imageUrl: null,
  container_type_id: null,
  official_name: "土づくり微生物資材",
  name_reading: "ツチヅクリビセイブツシザイ",
  evidences: materialEvidence,
  compositionType: {
    id: "00000000-0000-4000-8000-000000000301",
    name: "液体",
    sort_order: 10,
  },
  effects: [
    {
      id: "00000000-0000-4000-8000-000000000302",
      name: "樹勢改善",
      sort_order: 10,
      categoryId: "00000000-0000-4000-8000-000000000303",
      categoryName: "その他",
      categorySortOrder: 40,
    },
  ],
  targetCropGroups: [],
  applicationMethods: [],
  targetCrops: [
    {
      id: "00000000-0000-4000-8000-000000000304",
      name: "トマト",
      sort_order: 10,
      groupId: "00000000-0000-4000-8000-000000000305",
      groupName: "果菜類",
      groupSortOrder: 10,
      sourceName: "トマト・ミニトマト",
    },
  ],
  ingredientCategories: [
    {
      id: "00000000-0000-4000-8000-000000000306",
      name: "微生物",
      short_name: "微生物",
      sort_order: 10,
    },
  ],
  ingredients: [
    {
      id: "00000000-0000-4000-8000-000000000307",
      name: "バチルス属菌",
      sort_order: 10,
      categoryId: "00000000-0000-4000-8000-000000000306",
      categoryName: "微生物",
      categorySortOrder: 10,
    },
  ],
  productTypes: [
    { id: "00000000-0000-4000-8000-000000000308", name: "微生物資材", sort_order: 10 },
  ],
  searchTags: [
    {
      id: "00000000-0000-4000-8000-000000000309",
      name: "根張り改善",
      category: "concern",
      sort_order: 10,
    },
  ],
};

export const materialReviews: ReviewListItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000801",
    material_id: materialDetail.id,
    author_user_id: "00000000-0000-4000-8000-000000000901",
    rating: 5,
    body: "定植後の根の動きがよく、株ごとの生育差が小さくなりました。",
    is_provided_sample: false,
    created_at: "2026-08-02T00:00:00.000Z",
    author: {
      user_id: "00000000-0000-4000-8000-000000000901",
      handle: "北のトマト農家",
      avatar_url: null,
      standpoint: "farmer",
      prefecture_code: 13,
    },
    crops: [{ id: "crop-tomato", name: "トマト" }],
    photos: [],
    helpfulCount: 12,
    helpfulVotedByViewer: false,
  },
];

const photoUrl =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20140%20140%22%3E%3Crect%20width%3D%22140%22%20height%3D%22140%22%20fill%3D%22%23dcefd8%22%2F%3E%3Ccircle%20cx%3D%2270%22%20cy%3D%2270%22%20r%3D%2238%22%20fill%3D%22%23618d48%22%2F%3E%3C%2Fsvg%3E";

export const storyImageUrl = photoUrl;

export const detailedReview: ReviewListItem = {
  ...materialReviews[0],
  id: "00000000-0000-4000-8000-000000000802",
  rating: 4,
  body: "育苗期から3回灌注しました。\n定植後の活着が早く、根量が目に見えて増えています。ただし高温期は効果が分かりにくく、追加で葉面散布も試しています。来季は施用時期を少し早めて比較する予定です。",
  author: {
    user_id: "00000000-0000-4000-8000-000000000902",
    handle: "南の施設園芸ファーム研究会長期試験担当",
    avatar_url: photoUrl,
    standpoint: "farmer",
    prefecture_code: 43,
  },
  crops: [
    { id: "crop-tomato", name: "トマト" },
    { id: "crop-cucumber", name: "キュウリ" },
  ],
  photos: [
    { id: "photo-1", url: photoUrl, caption: "定植2週間後の根", sort_order: 0 },
    { id: "photo-2", url: photoUrl, caption: null, sort_order: 1 },
  ],
  helpfulCount: 3,
};

export const withdrawnReview: ReviewListItem = {
  ...materialReviews[0],
  id: "00000000-0000-4000-8000-000000000803",
  author: null,
  crops: [],
  rating: 2,
  body: "効果は感じられませんでした。",
};

export const materialReports: PublishedUsageReport[] = [
  {
    id: "00000000-0000-4000-8000-000000000851",
    material_id: materialDetail.id,
    title: "トマト促成栽培での根張り比較（対照区あり）",
    summary: "",
    published_at: "2026-08-10T00:00:00.000Z",
    author: {
      user_id: "00000000-0000-4000-8000-000000000901",
      handle: "北のトマト農家",
      avatar_url: null,
    },
    crop: { id: "crop-tomato", name: "トマト" },
    coverImage: { id: "media-1", url: photoUrl, media_type: "image", sort_order: 0 },
    helpfulCount: 8,
    viewCount: 120,
  },
  {
    id: "00000000-0000-4000-8000-000000000852",
    material_id: materialDetail.id,
    title: null,
    summary: "",
    published_at: "2026-08-12T00:00:00.000Z",
    author: null,
    crop: null,
    coverImage: null,
    helpfulCount: 0,
    viewCount: 4,
  },
];

export const relatedMaterials: MaterialListItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000111",
    name: "根張りサポート液 バイオルート",
    manufacturer_name: "グリーンバイオ株式会社",
    sales_status: "販売中",
    seller_id: null,
    manufacturer_verified_at: null,
    publication_status: "published",
    review_count: 6,
    avg_rating: 3.8,
    control_plot_ratio: null,
    created_at: "2026-07-01T00:00:00.000Z",
    description: null,
    imageUrl: "/images/container-shapes/5.png",
    container_type_id: 5,
  },
  {
    id: "00000000-0000-4000-8000-000000000112",
    name: "土壌微生物活性剤 ツチイキル プレミアム 業務用大容量タイプ",
    manufacturer_name: "株式会社とても長いメーカー名の農業資材研究所",
    sales_status: "販売中",
    seller_id: null,
    manufacturer_verified_at: null,
    publication_status: "published",
    review_count: 0,
    avg_rating: null,
    control_plot_ratio: null,
    created_at: "2026-07-01T00:00:00.000Z",
    description: null,
    imageUrl: null,
    container_type_id: null,
  },
];

export const materialLinks: MaterialPageContent["links"] = [
  {
    group: "overview",
    title: "製品パンフレット",
    url: "https://example.com/catalog.pdf",
    trial: null,
  },
  { group: "overview", title: "", url: "https://example.com/product", trial: null },
  { group: "safety", title: "安全データシート", url: "not a url", trial: null },
  {
    group: "public_trial",
    title: "トマト栽培試験成績書",
    url: "https://example.com/trial.pdf",
    trial: {
      crops: "トマト",
      summary:
        "対照区と比べて根量が増え、収量が約1割増加した。高温期の試験では差が小さく、追加の検証が必要とされている。",
      institution: "○○県農業試験場",
      year: 2025,
      pageCount: 12,
    },
  },
  {
    group: "other_trial",
    title: "生産者団体の比較試験",
    url: "",
    trial: { crops: "", summary: "", institution: "", year: null, pageCount: null },
  },
];
