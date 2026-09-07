"use client";

import { useActionState } from "react";

import { adminActionsStyle } from "@/app/admin/_components/AdminUI";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { setMaterialPublicationStatusAction } from "@/app/admin/materials/actions";
import { Select } from "@/components";
import { Field, FormMessage } from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { css } from "../../../../../styled-system/css";

const formStyle = css({ display: "flex", flexDirection: "column", gap: "3" });

export function PublicationStatusForm({
  materialId,
  status,
}: {
  materialId: string;
  status: string;
}) {
  const [state, formAction] = useActionState(
    setMaterialPublicationStatusAction,
    initialMaterialFormState,
  );

  return (
    <form action={formAction} className={formStyle}>
      <input name="materialId" type="hidden" value={materialId} />
      <Field
        guide="掲載終了にすると一般ユーザーには資材が表示されなくなります。データは保持され、担当メーカーと運営は引き続き確認できます。"
        htmlFor="publicationStatus"
        label="公開状態"
        requirement="required"
      >
        <Select defaultValue={status} id="publicationStatus" name="publicationStatus">
          <option value="published">公開中</option>
          <option value="archived">掲載終了</option>
        </Select>
      </Field>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}
      <div className={adminActionsStyle}>
        <SubmitButton label="公開状態を更新" pendingLabel="更新中…" />
      </div>
    </form>
  );
}
