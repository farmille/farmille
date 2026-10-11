"use client";

import { startTransition, useActionState } from "react";

import { adminActionsStyle } from "@/app/admin/_components/AdminUI";
import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { processContentReportAction } from "@/app/admin/reports/actions";
import { Button } from "@/components";
import { Notice } from "@/components/form";
import type { ContentReportTargetType } from "@/server/admin/reports";
import { css } from "../../../../styled-system/css";

const wrapStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  minW: "220px",
});

/** 1件の通報に対する解決・却下操作。 */
export function ReportActions({
  reportId,
  targetType,
}: {
  reportId: string;
  targetType: ContentReportTargetType;
}) {
  const [state, formAction, pending] = useActionState(
    processContentReportAction,
    initialAdminActionState,
  );

  const submit = (nextStatus: "resolved" | "dismissed"): void => {
    const formData = new FormData();
    formData.set("reportId", reportId);
    formData.set("nextStatus", nextStatus);
    startTransition(() => {
      formAction(formData);
    });
  };

  const resolveLabel =
    targetType === "profile" || targetType === "material"
      ? "運用対応済みにする"
      : "非公開化して解決";

  return (
    <div className={wrapStyle}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}
      <div className={adminActionsStyle}>
        <Button disabled={pending} onClick={() => submit("resolved")} size="sm">
          {resolveLabel}
        </Button>
        <Button disabled={pending} onClick={() => submit("dismissed")} size="sm" variant="ghost">
          通報を却下
        </Button>
      </div>
    </div>
  );
}
