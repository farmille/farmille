"use client";

import { useActionState } from "react";
import * as v from "valibot";

import { adminActionsStyle } from "@/app/admin/_components/AdminUI";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { setMaterialPublicationStatusAction } from "@/app/admin/materials/actions";
import { RadioGroup } from "@/components";
import { Field, FormMessage } from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { css } from "../../../../../styled-system/css";

const formStyle = css({ display: "flex", flexDirection: "column", gap: "3" });

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
    <form action={formAction} className={formStyle}>
      <input name="materialId" type="hidden" value={materialId} />
      <Field
        guide="掲載終了にすると一般ユーザーには資材が表示されなくなります。データは保持され、担当メーカーと運営は引き続き確認できます。"
        label="公開状態"
        labelId="publicationStatus-label"
        requirement="required"
      >
        <RadioGroup
          aria-labelledby="publicationStatus-label"
          defaultValue={current}
          name="publicationStatus"
          options={[
            { value: "published", label: "公開中" },
            { value: "archived", label: "掲載終了" },
          ]}
          required
        />
      </Field>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}
      <div className={adminActionsStyle}>
        <SubmitButton label="公開状態を更新" pendingLabel="更新中…" />
      </div>
    </form>
  );
}
