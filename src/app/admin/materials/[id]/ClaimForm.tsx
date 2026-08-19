"use client";

import { useActionState } from "react";

import { adminActionsStyle } from "@/app/admin/_components/AdminUI";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { setMaterialSellerAction } from "@/app/admin/materials/actions";
import { Select } from "@/components";
import { Field, FormMessage } from "@/components/auth/Fields";
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
        guide="承認済みの出品者だけを選べます。未 claim に戻すと「メーカー確認済み」バッジは外れます。"
        htmlFor="sellerId"
        label="claim 元の出品者"
        requirement="optional"
      >
        {/* 更新後に再検証された claim 先を確実に反映させるため、値が変わったら作り直す。 */}
        <Select
          defaultValue={currentSellerId ?? ""}
          id="sellerId"
          key={currentSellerId ?? "unclaimed"}
          name="sellerId"
        >
          <option value="">未 claim（解除する）</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.official_name}（{seller.login_id}）
            </option>
          ))}
        </Select>
      </Field>
      <div className={adminActionsStyle}>
        <SubmitButton label="claim を更新する" pendingLabel="更新中…" />
      </div>
    </form>
  );
}
