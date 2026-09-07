"use client";

import { useActionState } from "react";

import { adminActionsStyle } from "@/app/admin/_components/AdminUI";
import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { resolveMaterialChangeRequestAction } from "@/app/admin/materials/requests/actions";
import { Button, Textarea } from "@/components";
import { Field, FormMessage } from "@/components/auth/Fields";
import { css } from "../../../../../../styled-system/css";

const formStyle = css({ display: "flex", flexDirection: "column", gap: "4" });

export function RequestDecisionForm({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    resolveMaterialChangeRequestAction,
    initialAdminActionState,
  );

  return (
    <form action={formAction} className={formStyle}>
      <input name="requestId" type="hidden" value={requestId} />
      <Field
        guide="却下する場合は理由が必須です。メーカーの申請詳細にも表示されます。"
        htmlFor="reviewNote"
        label="メーカーへの連絡メモ"
        requirement="optional"
      >
        <Textarea id="reviewNote" name="reviewNote" />
      </Field>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}
      <div className={adminActionsStyle}>
        <Button disabled={pending} name="decision" type="submit" value="approve">
          {pending ? "処理中…" : "承認して反映"}
        </Button>
        <Button disabled={pending} name="decision" type="submit" value="reject" variant="danger">
          却下する
        </Button>
      </div>
    </form>
  );
}
