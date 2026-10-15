"use client";

import { useActionState } from "react";
import * as v from "valibot";

import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { setMaterialPublicationStatusAction } from "@/app/admin/materials/actions";
import { Form, FormActions, Notice, RadioGroup, SubmitButton } from "@/components/form";

const publicationStatusSchema = v.picklist(["published", "archived"]);

export function PublicationStatusForm({
  materialId,
  status,
}: {
  materialId: string;
  status: string;
}) {
  const current = v.parse(publicationStatusSchema, status);
  const [state, formAction] = useActionState(
    setMaterialPublicationStatusAction,
    initialMaterialFormState,
  );

  return (
    <Form action={formAction}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}
      <RadioGroup
        description="掲載終了にすると一般ユーザーには資材が表示されなくなります。データは保持され、担当メーカーと運営は引き続き確認できます。"
        label="公開状態"
        name="publicationStatus"
        requirement="required"
        defaultValue={current}
        options={[
          { value: "published", label: "公開中" },
          { value: "archived", label: "掲載終了" },
        ]}
      />
      <input name="materialId" type="hidden" value={materialId} />
      <FormActions layout="row">
        <SubmitButton pendingLabel="更新中…">公開状態を更新</SubmitButton>
      </FormActions>
    </Form>
  );
}
