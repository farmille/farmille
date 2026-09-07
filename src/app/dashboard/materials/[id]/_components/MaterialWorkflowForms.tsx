"use client";

import { useActionState } from "react";

import {
  confirmMaterialInformationAction,
  submitMaterialArchiveAction,
} from "@/app/dashboard/materials/actions";
import {
  initialSellerFormState,
  sellerFieldErrors,
} from "@/app/dashboard/materials/_components/form-state";
import { FormMessage, PendingButton, Textarea } from "@/components";
import { Field } from "@/components/auth/Fields";
import { css } from "../../../../../../styled-system/css";

const formStyle = css({ display: "flex", flexDirection: "column", gap: "3" });

export function ConfirmMaterialInformationForm({ materialId }: { materialId: string }) {
  const [state, formAction] = useActionState(
    confirmMaterialInformationAction.bind(null, materialId),
    initialSellerFormState,
  );

  return (
    <form action={formAction} className={formStyle}>
      {state.status === "idle" ? null : (
        <FormMessage status={state.status}>{state.message}</FormMessage>
      )}
      <PendingButton label="この情報を確認済みにする" pendingLabel="確認中…" />
    </form>
  );
}

export function ArchiveMaterialForm({ materialId }: { materialId: string }) {
  const [state, formAction] = useActionState(
    submitMaterialArchiveAction.bind(null, materialId),
    initialSellerFormState,
  );
  const errors = sellerFieldErrors(state);

  return (
    <form action={formAction} className={formStyle}>
      <Field
        error={errors.reason}
        guide="運営の承認後、一般ユーザーには資材が表示されなくなります。資材と過去の投稿データは保持されます。"
        htmlFor="archiveReason"
        label="掲載終了理由"
        requirement="required"
      >
        <Textarea id="archiveReason" name="reason" required />
      </Field>
      {state.status === "idle" ? null : (
        <FormMessage status={state.status}>{state.message}</FormMessage>
      )}
      <PendingButton label="掲載終了を申請" pendingLabel="申請中…" variant="danger" />
    </form>
  );
}
