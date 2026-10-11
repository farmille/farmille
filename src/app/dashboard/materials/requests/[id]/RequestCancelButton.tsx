"use client";

import { useActionState } from "react";

import { cancelMaterialChangeRequestAction } from "@/app/dashboard/materials/actions";
import { initialSellerFormState } from "@/app/dashboard/materials/_components/form-state";
import { Notice, SubmitButton } from "@/components/form";
import { css } from "../../../../../../styled-system/css";

const stackStyle = css({ display: "flex", flexDirection: "column", gap: "3" });

export function RequestCancelButton({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(
    cancelMaterialChangeRequestAction.bind(null, requestId),
    initialSellerFormState,
  );

  return (
    <form action={formAction} className={stackStyle}>
      {state.status === "idle" ? null : <Notice tone={state.status}>{state.message}</Notice>}
      <SubmitButton pendingLabel="取消中…" variant="danger">
        申請を取り消す
      </SubmitButton>
    </form>
  );
}
