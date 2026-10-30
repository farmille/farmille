"use client";

import { useEffect, useReducer } from "react";

export function useReportReadingProgress(busy: boolean) {
  const [now, setNow] = useReducer((_current: number, next: number) => next, 0);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);
  return { now, setNow };
}
