"use client";
import { useEffect, useRef, useReducer } from "react";
import type { PostTarget } from "@/server/queries/post-actions";
import { recordReviewCardView } from "@/server/actions/post-actions";

export function usePostCardView(target: PostTarget, id: string | undefined) {
  const [error, setError] = useReducer(
    (_current: string | null, next: string | null) => next,
    null,
  );
  const viewRef = useRef<HTMLSpanElement>(null);
  const recorded = useRef(false);
  useEffect(() => {
    if (target !== "review" || id === undefined || viewRef.current === null) return;
    const observer = new IntersectionObserver((entries) => {
      if (recorded.current || !entries.some((entry) => entry.isIntersecting)) return;
      recorded.current = true;
      observer.disconnect();
      void recordReviewCardView(id).catch(() => setError("閲覧数を記録できませんでした。"));
    });
    observer.observe(viewRef.current);
    return () => observer.disconnect();
  }, [target, id]);
  return { error, viewRef };
}
