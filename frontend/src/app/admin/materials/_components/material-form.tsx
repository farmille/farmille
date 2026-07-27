"use client";

import { useActionState } from "react";

import {
  adminActionsStyle,
  adminFieldGridStyle,
  adminInlineNoteStyle,
} from "@/app/admin/_components/admin-ui";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { createMaterialAction, updateMaterialAction } from "@/app/admin/materials/actions";
import { TAG_CATEGORY_LABELS, toTagChipCategory } from "@/components";
import { controlStyle, Field, FormMessage } from "@/components/auth/fields";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AdminMaterialDetail } from "@/server/admin/materials";
import type { AdminTagItem } from "@/server/admin/tags";
import { css } from "../../../../../styled-system/css";

const formStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

const groupTitleStyle = css({
  fontSize: "md",
  fontWeight: "700",
  color: "text.muted",
  mt: "2",
});

const chipGridStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const chipLabelStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "pill",
  px: "2.5",
  py: "1.5",
  fontSize: "sm",
  cursor: "pointer",
  "&:has(input:checked)": {
    borderColor: "brand.primary",
    bg: "brand.soft",
    fontWeight: "700",
  },
});

const tagCategoryStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  mb: "3",
});

const tagCategoryNameStyle = css({
  fontSize: "sm",
  fontWeight: "700",
  color: "text.subtle",
});

type MaterialFormProps = {
  material: AdminMaterialDetail | null;
  tags: AdminTagItem[];
};

function TextField({
  defaultValue,
  error,
  guide,
  label,
  name,
  required,
}: {
  defaultValue?: string;
  error?: string;
  guide?: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <Field
      error={error}
      guide={guide}
      htmlFor={name}
      label={label}
      requirement={required === true ? "required" : "optional"}
    >
      <input
        className={controlStyle}
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        required={required}
        type="text"
      />
    </Field>
  );
}

function TextAreaField({
  defaultValue,
  label,
  name,
  rows = 4,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  rows?: number;
}) {
  return (
    <Field htmlFor={name} label={label} requirement="optional">
      <textarea
        className={controlStyle}
        defaultValue={defaultValue ?? ""}
        id={name}
        name={name}
        rows={rows}
      />
    </Field>
  );
}

/** 資材の登録・編集フォーム。admin は分類・検索層と一次情報層の両方を編集できる（01 §3）。 */
export function MaterialForm({ material, tags }: MaterialFormProps) {
  const isEdit = material !== null;
  const [state, formAction] = useActionState(
    isEdit ? updateMaterialAction : createMaterialAction,
    initialMaterialFormState,
  );
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  // エラー時は送信値を優先し、無ければ保存済みの値（新規登録は空）に戻す。
  const submitted = state.status === "error" ? state.values : undefined;
  const valueOf = (field: string, stored: string | null | undefined): string =>
    submitted?.fields[field] ?? stored ?? "";
  const selectedTagIds = new Set(submitted?.tagIds ?? material?.tagIds ?? []);
  const categories = [...new Set(tags.map((tag) => tag.category))];

  return (
    <form action={formAction} className={formStyle} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}
      {isEdit ? <input name="materialId" type="hidden" value={material.id} /> : null}

      <p className={groupTitleStyle}>分類・検索層（Farmille 所有）</p>
      <div className={adminFieldGridStyle}>
        <TextField
          defaultValue={valueOf("name", material?.name)}
          error={fieldErrors.name}
          label="資材名"
          name="name"
          required
        />
        <TextField
          defaultValue={valueOf("manufacturerName", material?.manufacturer_name)}
          error={fieldErrors.manufacturerName}
          guide="未 claim でも表示するマスタ由来の表示名。"
          label="メーカー名"
          name="manufacturerName"
          required
        />
        <TextField
          defaultValue={valueOf("productType", material?.product_type)}
          label="種別"
          name="productType"
        />
        <TextField
          defaultValue={valueOf("jbsaClass", material?.jbsa_class)}
          guide="JBSA の効果分類。"
          label="効果分類"
          name="jbsaClass"
        />
        <TextField
          defaultValue={valueOf("salesStatus", material?.sales_status)}
          label="販売状況"
          name="salesStatus"
        />
      </div>

      <Field label="タグ" requirement="optional">
        <div>
          {categories.map((category) => (
            <div className={tagCategoryStyle} key={category}>
              <span className={tagCategoryNameStyle}>
                {TAG_CATEGORY_LABELS[toTagChipCategory(category)]}
              </span>
              <div className={chipGridStyle}>
                {tags
                  .filter((tag) => tag.category === category)
                  .map((tag) => (
                    <label className={chipLabelStyle} key={tag.id}>
                      <input
                        defaultChecked={selectedTagIds.has(tag.id)}
                        name="tagIds"
                        type="checkbox"
                        value={tag.id}
                      />
                      {tag.name}
                    </label>
                  ))}
              </div>
            </div>
          ))}
          {tags.length === 0 ? (
            <p className={adminInlineNoteStyle}>
              タグが登録されていません。タグ・作物マスタから追加してください。
            </p>
          ) : null}
        </div>
      </Field>

      <p className={groupTitleStyle}>
        一次情報層（claim 済み出品者が編集する。ここでは初期値を入れる）
      </p>
      <TextAreaField
        defaultValue={valueOf("description", material?.description)}
        label="紹介文"
        name="description"
      />
      <TextAreaField
        defaultValue={valueOf("generalUse", material?.general_use)}
        label="一般用途"
        name="generalUse"
      />
      <div className={adminFieldGridStyle}>
        <TextField
          defaultValue={valueOf("ingredients", material?.ingredients)}
          label="主成分"
          name="ingredients"
        />
        <TextField
          defaultValue={valueOf("mechanism", material?.mechanism)}
          label="作用機序"
          name="mechanism"
        />
        <TextField
          defaultValue={valueOf("priceRange", material?.price_range)}
          label="価格帯"
          name="priceRange"
        />
      </div>
      <TextAreaField
        defaultValue={valueOf("usageText", material?.usage_text)}
        label="使い方"
        name="usageText"
      />
      <div className={adminFieldGridStyle}>
        <TextField
          defaultValue={valueOf("officialUrl", material?.official_url)}
          error={fieldErrors.officialUrl}
          label="公式 URL"
          name="officialUrl"
        />
        <TextField
          defaultValue={valueOf("catalogUrl", material?.catalog_url)}
          error={fieldErrors.catalogUrl}
          label="カタログ URL"
          name="catalogUrl"
        />
      </div>

      <div className={adminActionsStyle}>
        <SubmitButton
          label={isEdit ? "保存する" : "登録する"}
          pendingLabel={isEdit ? "保存中…" : "登録中…"}
        />
      </div>
    </form>
  );
}
