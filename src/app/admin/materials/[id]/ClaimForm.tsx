"use client";

import { useActionState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { initialMaterialFormState, type MaterialFormState } from "@/app/admin/_lib/action-state";
import { setMaterialSellerAction } from "@/app/admin/materials/actions";
import { Field, Form, FormActions, Input, Notice, Select, SubmitButton } from "@/components/form";

export type ClaimSellerOption = {
  id: string;
  official_name: string;
  login_id: string;
};

/** claim の紐づけ・解除（01 §6。v1 は admin の手動操作で成立させる）。 */
export function ClaimForm({
  currentSellerId,
  materialId,
  sellers,
}: {
  currentSellerId: string | null;
  materialId: string;
  sellers: ClaimSellerOption[];
}) {
  const form = useForm({
    defaultValues: { sellerId: currentSellerId ?? "", documentReference: "" },
  });

  const values = useStore(form.store, (state) => state.values);

  const [state, formAction] = useActionState(
    async (previous: MaterialFormState, data: FormData) => {
      const result = await setMaterialSellerAction(previous, data);

      if (result.status === "done") form.setFieldValue("documentReference", "");

      return result;
    },
    initialMaterialFormState,
  );

  return (
    <Form action={formAction} persist={false}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}
      <Field
        description="申請と確認資料で、このメーカーにこの資材の資材オーナー権限を渡してよいことを確認してください。会社名が一致するだけでは付与できません。"
        label="資材オーナー権限を付与するメーカー"
        name="sellerId"
        requirement="optional"
      >
        <Select
          label={null}
          value={values.sellerId}
          onValueChange={(value) => form.setFieldValue("sellerId", value ?? "")}
          options={[
            { value: "", label: "資材オーナー権限なし（取り消す）" },
            ...sellers.map((seller) => ({
              value: seller.id,
              label: `${seller.official_name}（${seller.login_id}）`,
            })),
          ]}
        />
      </Field>
      <Input
        description="付与時は必須です。確認資料の保管先または受付番号を記入してください。公開されません。"
        label="確認資料の保管先または受付番号"
        name="documentReference"
        value={values.documentReference}
        onChange={(event) => form.setFieldValue("documentReference", event.target.value)}
        maxLength={2000}
      />
      <input name="materialId" type="hidden" value={materialId} />
      <FormActions layout="row">
        <SubmitButton pendingLabel="更新中…">資材オーナー権限を更新する</SubmitButton>
      </FormActions>
    </Form>
  );
}
