import type { MaterialDetail, MaterialEvidence } from "@/server/queries/materials";
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
  images: [],
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
    { id: "00000000-0000-4000-8000-000000000306", name: "微生物資材", sort_order: 10 },
  ],
  ingredients: [
    {
      id: "00000000-0000-4000-8000-000000000307",
      name: "バチルス属菌",
      sort_order: 10,
      categoryId: "00000000-0000-4000-8000-000000000306",
      categoryName: "微生物資材",
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
    has_control_plot: true,
    is_provided_sample: false,
    created_at: "2026-08-02T00:00:00.000Z",
    author: {
      user_id: "00000000-0000-4000-8000-000000000901",
      handle: "北のトマト農家",
      avatar_url: null,
    },
    crops: [{ id: "crop-tomato", name: "トマト" }],
    photos: [],
    helpfulCount: 12,
    helpfulVotedByViewer: false,
  },
];
