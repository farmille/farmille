"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { initialAdminActionState } from "@/app/admin/_lib/action-state";
import { resolveMaterialChangeRequestAction } from "@/app/admin/materials/requests/actions";
import { Button } from "@/components";
import { Form, FormActions, Notice, Textarea } from "@/components/form";

export function RequestDecisionForm({ requestId }: { requestId: string }) {
  const form = useForm({ defaultValues: { reviewNote: "" } });
  const reviewNote = useStore(form.store, (state) => state.values.reviewNote);
  const [state, formAction, pending] = useActionState(
    resolveMaterialChangeRequestAction,
    initialAdminActionState,
  );

  return (
    <Form
      action={formAction}
      persist="request-decision"
      onRestore={(restored) =>
        form.setFieldValue("reviewNote", restored.get("reviewNote")?.[0] ?? "")
      }
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}
      <Textarea
        description="却下する場合は理由が必須です。メーカーの申請詳細にも表示されます。"
        label="メーカーへの連絡メモ"
        name="reviewNote"
        value={reviewNote}
        onChange={(event) => form.setFieldValue("reviewNote", event.target.value)}
        requirement="optional"
      />
      <input name="requestId" type="hidden" value={requestId} />
      <FormActions layout="row">
        <Button disabled={pending} name="decision" type="submit" value="approve">
          {pending ? "処理中…" : "承認して反映"}
        </Button>
        <Button disabled={pending} name="decision" type="submit" value="reject" variant="danger">
          却下する
        </Button>
      </FormActions>
    </Form>
  );
}
