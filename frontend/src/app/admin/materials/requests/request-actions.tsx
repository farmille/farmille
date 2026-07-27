"use client";

import { startTransition, useActionState } from "react";

import { adminActionsStyle } from "@/app/admin/_components/admin-ui";
import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { resolveEditRequestAction } from "@/app/admin/materials/requests/actions";
import { Button } from "@/components";
import { FormMessage } from "@/components/auth/fields";
import { css } from "../../../../../styled-system/css";

const wrapStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

/** 1件の分類変更申請に対する処理ボタン。 */
export function EditRequestActions({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    resolveEditRequestAction,
    initialAdminActionState,
  );

  const submit = (nextStatus: "done" | "declined"): void => {
    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("nextStatus", nextStatus);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className={wrapStyle}>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}
      <div className={adminActionsStyle}>
        <Button disabled={pending} onClick={() => submit("done")} size="sm">
          対応済みにする
        </Button>
        <Button disabled={pending} onClick={() => submit("declined")} size="sm" variant="ghost">
          見送る
        </Button>
      </div>
    </div>
  );
}
