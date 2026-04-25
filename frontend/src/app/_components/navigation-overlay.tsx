"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NavigationOverlay() {
  const pathname = usePathname();
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);

  // 遷移先に到達すると pendingPathname === pathname になり overlay が消える（derived）
  const isNavigating =
    pendingPathname !== null && pendingPathname !== pathname;

  // pathname 変化で pendingPathname を clear する（forward nav 完了 / back button /
  // bfcache restore すべてで stale state を残さない）。これが無いと back button で
  // 戻った先で `pendingPathname !== pathname` が再び true になり overlay が出っぱなしになる。
  useEffect(() => {
    // 外部 prop (pathname) 変化に対する derived state 同期パターン。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingPathname(null);
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

      setPendingPathname(url.pathname);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!isNavigating) return null;

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
