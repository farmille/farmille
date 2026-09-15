"use client";

import { useActionState } from "react";

import { adminActionsStyle } from "@/app/admin/_components/AdminUI";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { setMaterialSellerAction } from "@/app/admin/materials/actions";
import { Select } from "@/components";
import { Field, FormMessage, controlStyle } from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { css } from "../../../../../styled-system/css";

const formStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

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
    <form action={formAction} className={formStyle}>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}
      <input name="materialId" type="hidden" value={materialId} />
      <Field
        guide="返送書類で、このメーカーにこの資材の編集権を渡してよいことを確認してください。会社名が一致するだけでは付与できません。"
        htmlFor="sellerId"
        label="編集権を付与するメーカー"
        requirement="optional"
      >
        {/* 更新後に再検証された claim 先を確実に反映させるため、値が変わったら作り直す。 */}
        <Select
          defaultValue={currentSellerId ?? ""}
          id="sellerId"
          key={currentSellerId ?? "unclaimed"}
          name="sellerId"
        >
          <option value="">編集権なし（取り消す）</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.official_name}（{seller.login_id}）
            </option>
          ))}
        </Select>
      </Field>
      <Field
        htmlFor="documentReference"
        label="確認した返送書類"
        guide="付与時は必須です。書類の保管先または管理番号を記入してください。公開されません。"
      >
        <input
          className={controlStyle}
          id="documentReference"
          name="documentReference"
          maxLength={2000}
        />
      </Field>
      <div className={adminActionsStyle}>
        <SubmitButton label="編集権を更新する" pendingLabel="更新中…" />
      </div>
    </form>
  );
}
