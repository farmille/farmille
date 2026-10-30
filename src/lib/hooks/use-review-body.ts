"use client";

import { useEffect, useReducer, useRef } from "react";

export function useReviewBody(children: string) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, toggleExpanded] = useReducer((current: boolean) => !current, false);
  const [overflowing, setOverflowing] = useReducer((_state: boolean, next: boolean) => next, false);

  useEffect(() => {
    const body = bodyRef.current;
    if (body === null || expanded) return;
    const measure = () => setOverflowing(body.scrollHeight > body.clientHeight);
    measure();
    // 画面幅が変わると折り返しが変わり、あふれるかどうかも変わる
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [children, expanded]);
  return { bodyRef, expanded, toggleExpanded, overflowing };
}
