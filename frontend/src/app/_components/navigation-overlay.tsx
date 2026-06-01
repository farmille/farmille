"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// グローバルなページ遷移 overlay。
//
// 重要な UX 設計判断 — Material 3 progress indicator + Nielsen Norman の
// 0.1s/1s/10s 閾値に従い、遷移が **300ms 未満** で完了する場合は spinner を
// 一切表示しない。これにより:
//   - ローカル backend の高速遷移 (50-200ms) は overlay フラッシュなしに
//     完了し、「動きが軽い」体感を維持
//   - 遅延 (Supabase round-trip + JOIN 等で 500ms+) のときだけ overlay が
//     現れ、ユーザーに「処理中」を伝える
//
// 参考:
//   - Material 3 Progress indicators (https://m3.material.io/components/progress-indicators)
//   - Nielsen Norman: Response Times — 0.1s = instant, 1s = uninterrupted flow,
//     10s = need progress feedback
//
// 仕組み:
//   1. <a> click 時に setTimeout 300ms で「まだ navigate 中なら」 overlay を出す
//   2. pathname 変化 (= 遷移完了) で timeout を cancel + overlay を消す
//   3. 同一 path / 修飾キー / 外部 URL は対象外
const NAVIGATION_OVERLAY_DELAY_MS = 300;

export function NavigationOverlay() {
  const pathname = usePathname();
  const [showOverlay, setShowOverlay] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // pathname 変化 = 遷移完了。pending timeout を canceled、overlay も非表示に。
  // back button / bfcache restore でも同じ経路を通る。
  // 外部 prop (pathname) 変化に対する derived state リセットパターンのため
  // set-state-in-effect を意図的に許可。
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowOverlay(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // primary button のみ、修飾キー併用は新タブ等のため対象外
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.(
        "a",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      // target="_blank" / download は現タブが変わらないため対象外
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // 外部 URL / fragment / mailto / tel をスキップ
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      // 同一 path への遷移は pathname が変わらず overlay が消えないためスキップ
      const url = new URL(anchor.href, window.location.origin);
      if (url.pathname === pathname) return;

      // 既存 timeout は cancel してから新規 setup (連続クリック対応)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowOverlay(true);
        timeoutRef.current = null;
      }, NAVIGATION_OVERLAY_DELAY_MS);
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  if (!showOverlay) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="読み込み中"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm"
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">読み込み中</span>
    </div>
  );
}
