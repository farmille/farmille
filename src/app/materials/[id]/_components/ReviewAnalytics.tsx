"use client";

import { useReviewAnalytics } from "@/lib/hooks/use-review-analytics";

export function ReviewAnalytics({
  materialId,
  submitted,
}: {
  materialId: string;
  submitted: boolean;
}) {
  useReviewAnalytics(materialId, submitted);

  return null;
}
