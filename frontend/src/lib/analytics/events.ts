"use client";

import { sendGAEvent } from "@next/third-parties/google";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

type AnalyticsEventMap = {
  review_submit: {
    material_id: string;
  };
  usage_report_submit: {
    material_id: string;
    report_count: number;
  };
  search: {
    filter_count: number;
    result_count: number;
    sort: string;
  };
  save_material: {
    material_id: string;
  };
};

function sendAnalyticsEvent<EventName extends keyof AnalyticsEventMap>(
  eventName: EventName,
  params: AnalyticsEventMap[EventName],
): void {
  // GA4 未設定時は sendGAEvent を呼ばず、初期化警告もネットワーク送信も発生させない。
  if (!measurementId) return;
  sendGAEvent("event", eventName, params);
}

export function trackReviewSubmitted(materialId: string): void {
  sendAnalyticsEvent("review_submit", { material_id: materialId });
}

export function trackUsageReportSubmitted(materialId: string, reportCount: number): void {
  sendAnalyticsEvent("usage_report_submit", {
    material_id: materialId,
    report_count: reportCount,
  });
}

export function trackSearchPerformed(input: AnalyticsEventMap["search"]): void {
  sendAnalyticsEvent("search", input);
}

export function trackMaterialSaved(materialId: string): void {
  sendAnalyticsEvent("save_material", { material_id: materialId });
}
