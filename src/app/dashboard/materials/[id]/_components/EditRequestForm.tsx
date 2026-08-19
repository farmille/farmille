"use client";

import { useActionState } from "react";

import { FormMessage, PendingButton, Textarea } from "@/components";
import { Field } from "@/components/auth/Fields";
import { css } from "../../../../../../styled-system/css";
import { submitEditRequestAction } from "../actions";
import { initialSellerFormState, sellerFieldErrors } from "./form-state";

const formLayout = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

export function EditRequestForm({ materialId }: { materialId: string }) {
  const [state, formAction] = useActionState(
    submitEditRequestAction.bind(null, materialId),
    initialSellerFormState,
  );
  const fieldErrors = sellerFieldErrors(state);

  return (
    <form action={formAction} className={formLayout}>
      <Field
        error={fieldErrors.requestText}
        guide="変更したい項目、希望する内容、根拠をまとめてください。運営が確認します。"
        htmlFor="requestText"
        label="申請内容"
        requirement="required"
      >
        <Textarea
          id="requestText"
          name="requestText"
          placeholder="例）資材タイプを微生物資材へ変更希望。製品仕様書の分類に基づきます。"
          required
          size="lg"
        />
      </Field>
      {state.status === "idle" ? null : (
        <FormMessage status={state.status}>{state.message}</FormMessage>
      )}
      <PendingButton label="分類変更を申請" pendingLabel="申請中…" />
    </form>
  );
}
