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
  },
  {
    id: "00000000-0000-4000-8000-000000000702",
    evidence_type: "trial",
    title: "トマト栽培試験結果",
    file_url: "https://example.com/trial.pdf",
    external_url: null,
    meta: null,
    sort_order: 20,
  },
];

export const materialDetail: MaterialDetail = {
  id: "00000000-0000-4000-8000-000000000101",
  name: "土づくり微生物資材",
  manufacturer_name: "グリーンバイオ株式会社",
  product_type: "微生物資材",
  jbsa_class: "土壌改良",
  sales_status: "販売中",
  seller_id: "00000000-0000-4000-8000-000000000201",
  review_count: 18,
  avg_rating: 4.2,
  control_plot_ratio: 0.72,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
  description: "土壌環境を整え、定植後の根張りを支える微生物資材です。",
  general_use: "定植前の土づくりに使用します。",
  ingredients: "バチルス属菌",
  mechanism: "有用微生物の定着を支援します。",
  usage_text: "10aあたり1kgを均一に散布します。",
  price_range: "5,000〜8,000円",
  official_url: "https://example.com/material",
  catalog_url: "https://example.com/catalog.pdf",
  images: [],
  evidences: materialEvidence,
  tags: [
    { id: "tag-crop", name: "トマト", category: "crop", sort_order: 10 },
    { id: "tag-effect", name: "発根促進", category: "effect", sort_order: 20 },
    { id: "tag-type", name: "微生物資材", category: "type", sort_order: 30 },
  ],
};

export const materialReviews: ReviewListItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000801",
    material_id: materialDetail.id,
    author_user_id: "00000000-0000-4000-8000-000000000901",
    rating: 5,
    body: "定植後の根の動きがよく、株ごとの生育差が小さくなりました。",
    crop_id: "crop-tomato",
    has_control_plot: true,
    is_provided_sample: false,
    created_at: "2026-08-02T00:00:00.000Z",
    author: {
      user_id: "00000000-0000-4000-8000-000000000901",
      handle: "北のトマト農家",
      avatar_url: null,
    },
    crop: { id: "crop-tomato", name: "トマト" },
    photos: [],
    helpfulCount: 12,
    helpfulVotedByViewer: false,
  },
];
