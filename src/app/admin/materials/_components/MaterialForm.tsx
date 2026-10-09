"use client";

import { useActionState, useMemo, type ReactNode } from "react";

import { adminFieldGridStyle } from "@/app/admin/_components/AdminUI";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { createMaterialAction, updateMaterialAction } from "@/app/admin/materials/actions";
import {
  CheckboxGroup,
  Field,
  Fieldset,
  Form,
  FormActions,
  Input,
  Notice,
  Select,
  SubmitButton,
  Textarea,
  type FieldErrors,
} from "@/components/form";
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

type MaterialFormProps = {
  classifications: ClassificationOptions;
  material: AdminMaterialDetail | null;
};

type ChoiceItem = { id: string; name: string };

/** 分類マスタの1区分。区分名を小見出しにしたチップの複数選択。 */
function ClassificationGroup({
  legend,
  name,
  items,
  selectedIds,
}: {
  legend: ReactNode;
  name: string;
  items: readonly ChoiceItem[];
  selectedIds: readonly string[];
}) {
  return (
    <Fieldset labelSize="sm" legend={legend}>
      <CheckboxGroup
        defaultValue={selectedIds}
        name={name}
        options={items.map((item) => ({ value: item.id, label: item.name }))}
        variant="chips"
      />
    </Fieldset>
  );
}

/** 資材の登録・編集フォーム。admin は分類・検索層と一次情報層の両方を編集できる（01 §3）。 */
export function MaterialForm({ classifications, material }: MaterialFormProps) {
  const isEdit = material !== null;
  const [state, formAction] = useActionState(
    isEdit ? updateMaterialAction : createMaterialAction,
    initialMaterialFormState,
  );
  // 分類 ID の不備（classifications）は、これまでどおり「効果」の欄に出す
  const errors = useMemo((): FieldErrors | undefined => {
    if (state.status !== "error" || state.fieldErrors === undefined) return undefined;
    const { classifications: classificationError, ...fieldErrors } = state.fieldErrors;
    return { ...fieldErrors, effectIds: classificationError };
  }, [state]);
  // エラー時は送信値を優先し、無ければ保存済みの値（新規登録は空）に戻す。
  const submitted = state.status === "error" ? state.values : undefined;
  const valueOf = (field: string, stored: string | null | undefined): string =>
    submitted?.fields[field] ?? stored ?? "";
  const selectedCropIds = submitted?.cropIds ?? material?.cropIds ?? [];
  const selectedEffectIds = submitted?.effectIds ?? material?.effectIds ?? [];
  const selectedIngredientCategoryIds =
    submitted?.ingredientCategoryIds ?? material?.ingredientCategoryIds ?? [];
  const selectedIngredientIds = submitted?.ingredientIds ?? material?.ingredientIds ?? [];
  const selectedSearchTagIds = submitted?.searchTagIds ?? material?.searchTagIds ?? [];

  return (
    <Form action={formAction} className={formStyle} errors={errors}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}
      {isEdit ? <input name="materialId" type="hidden" value={material.id} /> : null}
      {/* 表示対象外の既存分類は、別の情報を保存しても失わない。 */}
      {(submitted?.productTypeIds ?? material?.productTypeIds ?? []).map((id) => (
        <input key={id} name="productTypeIds" type="hidden" value={id} />
      ))}

      <p className={groupTitleStyle}>分類・検索層（Farmille 所有）</p>
      <div className={adminFieldGridStyle}>
        <Field label="資材名" name="name" requirement="required">
          <Input defaultValue={valueOf("name", material?.name)} />
        </Field>
        <Field
          description="未 claim でも表示するマスタ由来の表示名。"
          label="メーカー名"
          name="manufacturerName"
          requirement="required"
        >
          <Input defaultValue={valueOf("manufacturerName", material?.manufacturer_name)} />
        </Field>
        <Field label="組成タイプ" name="compositionTypeId" requirement="optional">
          <Select
            defaultValue={valueOf("compositionTypeId", material?.composition_type_id)}
            options={[
              { value: "", label: "未設定" },
              ...classifications.compositionTypes.map((option) => ({
                value: option.id,
                label: option.name,
              })),
            ]}
          />
        </Field>
        <Field label="販売状況" name="salesStatus" requirement="optional">
          <Input defaultValue={valueOf("salesStatus", material?.sales_status)} />
        </Field>
      </div>

      <Fieldset legend="効果" name="effectIds" requirement="optional">
        {classifications.effectCategories.map((category) => (
          <ClassificationGroup
            items={classifications.effects.filter((effect) => effect.categoryId === category.id)}
            key={category.id}
            legend={category.name}
            name="effectIds"
            selectedIds={selectedEffectIds}
          />
        ))}
      </Fieldset>

      <Fieldset legend="対象作物（Farmille正規化）" requirement="optional">
        {[...new Set(classifications.crops.map((crop) => crop.groupId))].map((groupId) => {
          const crops = classifications.crops.filter((crop) => crop.groupId === groupId);
          return (
            <ClassificationGroup
              items={crops}
              key={groupId}
              legend={crops[0]?.groupName}
              name="cropIds"
              selectedIds={selectedCropIds}
            />
          );
        })}
      </Fieldset>

      <Fieldset
        legend="資材ジャンル（JBSA材料8分類）"
        name="ingredientCategoryIds"
        requirement="optional"
      >
        <CheckboxGroup
          defaultValue={selectedIngredientCategoryIds}
          name="ingredientCategoryIds"
          options={classifications.ingredientCategories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          variant="chips"
        />
      </Fieldset>

      <Fieldset legend="個別材料" requirement="optional">
        {classifications.ingredientCategories.map((category) => (
          <ClassificationGroup
            items={classifications.ingredients.filter(
              (ingredient) => ingredient.categoryId === category.id,
            )}
            key={category.id}
            legend={category.name}
            name="ingredientIds"
            selectedIds={selectedIngredientIds}
          />
        ))}
      </Fieldset>

      <Fieldset
        description={
          classifications.searchTags.length === 0 ? "検索補助タグが登録されていません。" : undefined
        }
        legend="検索補助タグ"
        requirement="optional"
      >
        {["concern", "condition"].map((category) => (
          <ClassificationGroup
            items={classifications.searchTags.filter((tag) => tag.category === category)}
            key={category}
            legend={category === "concern" ? "悩み" : "条件・使い方"}
            name="searchTagIds"
            selectedIds={selectedSearchTagIds}
          />
        ))}
      </Fieldset>

      <p className={groupTitleStyle}>
        一次情報層（claim 済みメーカーが編集する。ここでは初期値を入れる）
      </p>
      <Field label="紹介文" name="description" requirement="optional">
        <Textarea defaultValue={valueOf("description", material?.description)} rows={4} />
      </Field>
      <Field label="一般用途" name="generalUse" requirement="optional">
        <Textarea defaultValue={valueOf("generalUse", material?.general_use)} rows={4} />
      </Field>
      <div className={adminFieldGridStyle}>
        <Field label="主成分" name="mainComponents" requirement="optional">
          <Input defaultValue={valueOf("mainComponents", material?.main_components)} />
        </Field>
        <Field label="作用機作" name="mechanism" requirement="optional">
          <Input defaultValue={valueOf("mechanism", material?.mechanism)} />
        </Field>
        <Field label="価格帯" name="priceRange" requirement="optional">
          <Input defaultValue={valueOf("priceRange", material?.price_range)} />
        </Field>
      </div>
      <Field label="使い方" name="usageText" requirement="optional">
        <Textarea defaultValue={valueOf("usageText", material?.usage_text)} rows={4} />
      </Field>
      <div className={adminFieldGridStyle}>
        <Field label="公式 URL" name="officialUrl" requirement="optional">
          <Input defaultValue={valueOf("officialUrl", material?.official_url)} />
        </Field>
        <Field label="カタログ URL" name="catalogUrl" requirement="optional">
          <Input defaultValue={valueOf("catalogUrl", material?.catalog_url)} />
        </Field>
      </div>

      <FormActions layout="row">
        <SubmitButton pendingLabel={isEdit ? "保存中…" : "登録中…"}>
          {isEdit ? "保存する" : "登録する"}
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
