"use client";

import { useEffect } from "react";

/**
 * URL のハッシュが targetId のとき、表示されたあとにその要素まで送る。
 * 感想口コミ欄は Suspense で後から流れてくるため、ブラウザや Next のハッシュ移動の時点では
 * 要素がまだ無く、投稿・削除後の `#reviews-heading` へ移らない。欄が出た時点でここから移す。
 * `trigger` が変わったとき（同じ画面での削除後など）にもう一度移す。
 */
export function ScrollToHashOnMount({ targetId, trigger }: { targetId: string; trigger: number }) {
  useEffect(() => {
    if (window.location.hash !== `#${targetId}`) return;
    document.getElementById(targetId)?.scrollIntoView({ block: "start" });
  }, [targetId, trigger]);
  return null;
}
