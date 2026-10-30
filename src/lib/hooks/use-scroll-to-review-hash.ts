"use client";

import { useEffect } from "react";

const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export function useScrollToReviewHash(headingId: string, cardIdPrefix: string, trigger: number) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash !== headingId && !hash.startsWith(cardIdPrefix)) return;
    // 編集した感想口コミが資材ページに出す数件に入らないときは、欄の見出しへ移す
    const target = document.getElementById(hash) ?? document.getElementById(headingId);
    if (target === null) return;

    const align = () => target.scrollIntoView({ block: "start" });
    const observer = new ResizeObserver(align);
    const stop = () => {
      observer.disconnect();
      for (const type of USER_SCROLL_EVENTS) window.removeEventListener(type, stop);
    };
    align();
    observer.observe(document.body);
    for (const type of USER_SCROLL_EVENTS) window.addEventListener(type, stop, { passive: true });
    return stop;
  }, [headingId, cardIdPrefix, trigger]);
}
