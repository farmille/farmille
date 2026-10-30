"use client";

import { useMountEffect } from "@/lib/hooks/use-mount-effect";

/** ページへ反映する前の編集がある間だけ置き、再読み込みやページを離れる操作で失わせない。 */
export function ReportLeaveWarning() {
  useMountEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);

    return () => window.removeEventListener("beforeunload", warn);
  });

  return null;
}
