"use client";

import { useEffect, useRef } from "react";

import { trackReviewSubmitted } from "@/lib/analytics/events";

export function ReviewAnalytics({
  materialId,
  submitted,
}: {
  materialId: string;
  submitted: boolean;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!submitted || tracked.current) return;
    tracked.current = true;
    trackReviewSubmitted(materialId);
  }, [materialId, submitted]);

  return null;
}
