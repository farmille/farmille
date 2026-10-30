"use client";

import { useEffect } from "react";

/** ページへ反映する前の編集も、再読み込みやページを離れる操作で失わせない。 */
export function useReportLeaveWarning(unsaved: boolean) {
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
}
