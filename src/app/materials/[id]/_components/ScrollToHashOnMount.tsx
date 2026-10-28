"use client";

import { useEffect } from "react";

const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * 感想口コミ欄は Suspense で後から流れてくる。Next はハッシュの移動先がまだ無いと移動をやめ、
 * 前の画面（投稿・編集フォーム）のスクロール位置のまま残るので、欄が出た時点でここから移す。
 * 移したあとに上の欄（実証詳細レポート・評価の分布）が流れてきて高さが変わるため、
 * 利用者が自分で操作するまでは移動先に合わせ直す。
 */
export function ScrollToHashOnMount({
  headingId,
  cardIdPrefix,
  trigger,
}: {
  headingId: string;
  cardIdPrefix: string;
  trigger: number;
}) {
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
  return null;
}
