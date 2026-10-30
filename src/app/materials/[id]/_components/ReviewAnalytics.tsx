"use client";

import { useRef } from "react";
import { trackReviewSubmitted } from "@/lib/analytics/events";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";

export function ReviewAnalytics({
  materialId,
  submitted,
}: {
  materialId: string;
  submitted: boolean;
}) {
  return submitted ? <SubmittedTracker materialId={materialId} /> : null;
}

function SubmittedTracker({ materialId }: { materialId: string }) {
  // StrictModeの再実行でも1回だけ送る。
  const tracked = useRef(false);
  useMountEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackReviewSubmitted(materialId);
  });
  return null;
}
