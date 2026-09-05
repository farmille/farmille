"use client";

import { useActionState } from "react";

import { cancelMaterialChangeRequestAction } from "@/app/dashboard/materials/actions";
import { initialSellerFormState } from "@/app/dashboard/materials/_components/form-state";
import { FormMessage, PendingButton } from "@/components";
import { css } from "../../../../../../styled-system/css";

const stackStyle = css({ display: "flex", flexDirection: "column", gap: "3" });

export function RequestCancelButton({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(
    cancelMaterialChangeRequestAction.bind(null, requestId),
    initialSellerFormState,
  );

  return (
    <form action={formAction} className={stackStyle}>
      {state.status === "idle" ? null : (
        <FormMessage status={state.status}>{state.message}</FormMessage>
      )}
      <PendingButton label="申請を取り消す" pendingLabel="取消中…" variant="danger" />
    </form>
  );
}
