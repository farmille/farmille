"use client";

import { useScrollToReviewHash } from "@/lib/hooks/use-scroll-to-review-hash";

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
  useScrollToReviewHash(headingId, cardIdPrefix, trigger);
  return null;
}
