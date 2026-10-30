"use client";

import { useEffect, useRef } from "react";
import type { UsageReportInput } from "@/lib/usage-report";

export function useReportMediaHistory(media: UsageReportInput["media"]) {
  const history = useRef(new Set<string>());
  useEffect(() => {
    for (const item of media) history.current.add(item.url);
  }, [media]);
  return history;
}
