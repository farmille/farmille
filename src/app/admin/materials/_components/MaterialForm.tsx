"use client";

import { Checkbox } from "@/components/Checkbox";

import { useActionState } from "react";

import {
  adminActionsStyle,
  adminFieldGridStyle,
  adminInlineNoteStyle,
} from "@/app/admin/_components/AdminUI";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { createMaterialAction, updateMaterialAction } from "@/app/admin/materials/actions";
import { controlStyle, Field, FormMessage } from "@/components/auth/Fields";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { AdminMaterialDetail } from "@/server/admin/materials";
import type { ClassificationOptions } from "@/server/queries/classifications";
import { css } from "../../../../../styled-system/css";

const formStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

const groupTitleStyle = css({
  fontSize: "md",
  fontWeight: "bold",
  color: "text.muted",
  mt: "2",
});

const checkboxGroupStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const checkboxLabelStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  px: "2.5",
  py: "1.5",
  fontSize: "sm",
  cursor: "pointer",
});

const classificationGroupStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  mb: "3",
});

const classificationGroupNameStyle = css({
  fontSize: "sm",
  fontWeight: "bold",
  color: "text.subtle",
});

type MaterialFormProps = {
  classifications: ClassificationOptions;
  material: AdminMaterialDetail | null;
};

type CheckboxOption = { id: string; name: string };

function CheckboxGroup({
  name,
  options,
  selectedIds,
}: {
  name: string;
  options: CheckboxOption[];
  selectedIds: ReadonlySet<string>;
}) {
  return (
    <div className={checkboxGroupStyle}>
      {options.map((option) => (
        <label className={checkboxLabelStyle} key={option.id}>
          <Checkbox defaultChecked={selectedIds.has(option.id)} name={name} value={option.id} />
          {option.name}
        </label>
      ))}
    </div>
  );
}

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
export function MaterialForm({ classifications, material }: MaterialFormProps) {
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
  const selectedCropIds = new Set(submitted?.cropIds ?? material?.cropIds ?? []);
  const selectedEffectIds = new Set(submitted?.effectIds ?? material?.effectIds ?? []);
  const selectedIngredientCategoryIds = new Set(
    submitted?.ingredientCategoryIds ?? material?.ingredientCategoryIds ?? [],
  );
  const selectedIngredientIds = new Set(submitted?.ingredientIds ?? material?.ingredientIds ?? []);
  const selectedSearchTagIds = new Set(submitted?.searchTagIds ?? material?.searchTagIds ?? []);

  return (
    <form action={formAction} className={formStyle} noValidate>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}
      {isEdit ? <input name="materialId" type="hidden" value={material.id} /> : null}
      {/* 表示対象外の既存分類は、別の情報を保存しても失わない。 */}
      {(submitted?.productTypeIds ?? material?.productTypeIds ?? []).map((id) => (
        <input key={id} name="productTypeIds" type="hidden" value={id} />
      ))}

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
        <Field
          error={fieldErrors.compositionTypeId}
          htmlFor="compositionTypeId"
          label="組成タイプ"
          requirement="optional"
        >
          <select
            className={controlStyle}
            defaultValue={valueOf("compositionTypeId", material?.composition_type_id)}
            id="compositionTypeId"
            name="compositionTypeId"
          >
            <option value="">未設定</option>
            {classifications.compositionTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </Field>
        <TextField
          defaultValue={valueOf("salesStatus", material?.sales_status)}
          label="販売状況"
          name="salesStatus"
        />
      </div>

      <Field error={fieldErrors.classifications} label="効果" requirement="optional">
        <div>
          {classifications.effectCategories.map((category) => (
            <div className={classificationGroupStyle} key={category.id}>
              <span className={classificationGroupNameStyle}>{category.name}</span>
              <CheckboxGroup
                name="effectIds"
                options={classifications.effects.filter(
                  (effect) => effect.categoryId === category.id,
                )}
                selectedIds={selectedEffectIds}
              />
            </div>
          ))}
        </div>
      </Field>

      <Field label="対象作物（Farmille正規化）" requirement="optional">
        <div>
          {[...new Set(classifications.crops.map((crop) => crop.groupId))].map((groupId) => {
            const crops = classifications.crops.filter((crop) => crop.groupId === groupId);
            return (
              <div className={classificationGroupStyle} key={groupId}>
                <span className={classificationGroupNameStyle}>{crops[0]?.groupName}</span>
                <CheckboxGroup name="cropIds" options={crops} selectedIds={selectedCropIds} />
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="資材ジャンル（JBSA材料8分類）" requirement="optional">
        <CheckboxGroup
          name="ingredientCategoryIds"
          options={classifications.ingredientCategories}
          selectedIds={selectedIngredientCategoryIds}
        />
      </Field>

      <Field label="個別材料" requirement="optional">
        <div>
          {classifications.ingredientCategories.map((category) => (
            <div className={classificationGroupStyle} key={category.id}>
              <span className={classificationGroupNameStyle}>{category.name}</span>
              <CheckboxGroup
                name="ingredientIds"
                options={classifications.ingredients.filter(
                  (ingredient) => ingredient.categoryId === category.id,
                )}
                selectedIds={selectedIngredientIds}
              />
            </div>
          ))}
        </div>
      </Field>

      <Field label="検索補助タグ" requirement="optional">
        <div>
          {["concern", "condition"].map((category) => (
            <div className={classificationGroupStyle} key={category}>
              <span className={classificationGroupNameStyle}>
                {category === "concern" ? "悩み" : "条件・使い方"}
              </span>
              <CheckboxGroup
                name="searchTagIds"
                options={classifications.searchTags.filter((tag) => tag.category === category)}
                selectedIds={selectedSearchTagIds}
              />
            </div>
          ))}
          {classifications.searchTags.length === 0 ? (
            <p className={adminInlineNoteStyle}>検索補助タグが登録されていません。</p>
          ) : null}
        </div>
      </Field>

      <p className={groupTitleStyle}>
        一次情報層（claim 済みメーカーが編集する。ここでは初期値を入れる）
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
          defaultValue={valueOf("mainComponents", material?.main_components)}
          label="主成分"
          name="mainComponents"
        />
        <TextField
          defaultValue={valueOf("mechanism", material?.mechanism)}
          label="作用機作"
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
