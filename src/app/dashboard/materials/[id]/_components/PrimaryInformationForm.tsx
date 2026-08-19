"use client";

import { useActionState } from "react";

import { FormMessage, Input, PendingButton, Textarea } from "@/components";
import { Field } from "@/components/auth/Fields";
import type { SellerMaterialDetail } from "@/server/queries/seller-dashboard";
import { css } from "../../../../../../styled-system/css";
import { updatePrimaryInformationAction } from "../actions";
import { initialSellerFormState, sellerFieldErrors } from "./form-state";

const formLayout = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

type PrimaryInformationFormProps = {
  material: SellerMaterialDetail;
};

/** Farmille 所有の分類項目を含めず、一次情報層の8項目だけを送信する。 */
export function PrimaryInformationForm({ material }: PrimaryInformationFormProps) {
  const [state, formAction] = useActionState(
    updatePrimaryInformationAction.bind(null, material.id),
    initialSellerFormState,
  );
  const fieldErrors = sellerFieldErrors(state);

  return (
    <form action={formAction} className={formLayout}>
      <Field
        error={fieldErrors.description}
        htmlFor="description"
        label="紹介文"
        requirement="optional"
      >
        <Textarea
          defaultValue={material.description ?? ""}
          id="description"
          name="description"
          placeholder="資材の特長や開発背景"
          size="lg"
        />
      </Field>
      <Field
        error={fieldErrors.general_use}
        htmlFor="general_use"
        label="一般用途"
        requirement="optional"
      >
        <Textarea
          defaultValue={material.general_use ?? ""}
          id="general_use"
          name="general_use"
          placeholder="どのような場面で使う資材か"
        />
      </Field>
      <Field
        error={fieldErrors.ingredients}
        htmlFor="ingredients"
        label="主成分"
        requirement="optional"
      >
        <Textarea
          defaultValue={material.ingredients ?? ""}
          id="ingredients"
          name="ingredients"
          placeholder="主な成分や菌株"
        />
      </Field>
      <Field
        error={fieldErrors.mechanism}
        htmlFor="mechanism"
        label="作用機序"
        requirement="optional"
      >
        <Textarea
          defaultValue={material.mechanism ?? ""}
          id="mechanism"
          name="mechanism"
          placeholder="植物や土壌へ働きかける仕組み"
        />
      </Field>
      <Field
        error={fieldErrors.usage_text}
        htmlFor="usage_text"
        label="使い方"
        requirement="optional"
      >
        <Textarea
          defaultValue={material.usage_text ?? ""}
          id="usage_text"
          name="usage_text"
          placeholder="希釈倍率や使用時期など"
          size="lg"
        />
      </Field>
      <Field
        error={fieldErrors.price_range}
        htmlFor="price_range"
        label="価格帯"
        requirement="optional"
      >
        <Input
          defaultValue={material.price_range ?? ""}
          id="price_range"
          name="price_range"
          placeholder="例）500mL 2,000円前後"
        />
      </Field>
      <Field
        error={fieldErrors.official_url}
        htmlFor="official_url"
        label="公式URL"
        requirement="optional"
      >
        <Input
          defaultValue={material.official_url ?? ""}
          id="official_url"
          name="official_url"
          placeholder="https://example.com/products/..."
          type="url"
        />
      </Field>
      <Field
        error={fieldErrors.catalog_url}
        htmlFor="catalog_url"
        label="カタログURL"
        requirement="optional"
      >
        <Input
          defaultValue={material.catalog_url ?? ""}
          id="catalog_url"
          name="catalog_url"
          placeholder="https://example.com/catalog.pdf"
          type="url"
        />
      </Field>

      {state.status === "idle" ? null : (
        <FormMessage status={state.status}>{state.message}</FormMessage>
      )}
      <PendingButton label="一次情報を保存" pendingLabel="保存中…" />
    </form>
  );
}
