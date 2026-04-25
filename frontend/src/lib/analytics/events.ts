// Phase 11a 必達 5 イベント（spec §2.2）
// PII を含めない: email / name は不可、user_id (UUID) も不要なら入れない

export type AnalyticsEvent =
  | { name: "sign_up_complete"; params: { role: string } }
  | { name: "review_submit"; params: { product_id: string } }
  | { name: "product_create"; params: { product_type_id: string } }
  | { name: "filter_apply"; params: { filter_type: "type" | "crop" } }
  | { name: "profile_gate_shown"; params: { product_id: string } }
  | { name: "profile_gate_completed"; params: { product_id: string } };

// page_view は @next/third-parties の GoogleAnalytics が自動発火するため
// 上記 union には含めない
