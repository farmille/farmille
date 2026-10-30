"use client";

import { useReviewCompletion } from "@/lib/hooks/use-review-completion";

export function ReviewCompletionToast() {
  useReviewCompletion();
  return null;
}
