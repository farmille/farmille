"use client";

import { useActionState } from "react";

import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
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
  const [state, formAction] = useActionState(setMaterialSellerAction, initialMaterialFormState);

  return (
    <Form action={formAction}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}
      <Field
        description="申請と確認資料で、このメーカーにこの資材の編集権を渡してよいことを確認してください。会社名が一致するだけでは付与できません。"
        label="編集権を付与するメーカー"
        name="sellerId"
        requirement="optional"
      >
        {/* 更新後に再検証された claim 先を確実に反映させるため、値が変わったら作り直す。 */}
        <Select
          label={null}
          defaultValue={currentSellerId ?? ""}
          key={currentSellerId ?? "unclaimed"}
          options={[
            { value: "", label: "編集権なし（取り消す）" },
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
        maxLength={2000}
      />
      <input name="materialId" type="hidden" value={materialId} />
      <FormActions layout="row">
        <SubmitButton pendingLabel="更新中…">編集権を更新する</SubmitButton>
      </FormActions>
    </Form>
  );
}
