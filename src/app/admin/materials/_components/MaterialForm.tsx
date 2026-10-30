"use client";

import { useActionState, useMemo } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { adminFieldGridStyle } from "@/app/admin/_components/AdminUI";
import { initialMaterialFormState } from "@/app/admin/_lib/action-state";
import { createMaterialAction, updateMaterialAction } from "@/app/admin/materials/actions";
import {
  CheckboxGroup,
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
  textStyle: "title",
  fontWeight: "bold",
  color: "text.muted",
  mt: "2",
});

type MaterialFormProps = {
  classifications: ClassificationOptions;
  material: AdminMaterialDetail | null;
};

type ChoiceItem = { id: string; name: string };

type FormErrorState = {
  errors: FieldErrors | undefined;
  classificationError: string | undefined;
};

function ClassificationGroup({
  legend,
  name,
  items,
  selectedIds,
  onValueChange,
}: {
  legend: string;
  name: string;
  items: readonly ChoiceItem[];
  selectedIds: readonly string[];
  onValueChange: (ids: string[]) => void;
}) {
  return (
    <CheckboxGroup
      labelSize="sm"
      label={legend}
      value={selectedIds}
      onValueChange={(next) =>
        onValueChange([
          ...selectedIds.filter((id) => !items.some((item) => item.id === id)),
          ...next,
        ])
      }
      name={name}
      options={items.map((item) => ({ value: item.id, label: item.name }))}
      variant="chips"
    />
  );
}

/** 資材の登録・編集フォーム。admin は分類・検索層と一次情報層の両方を編集できる（01 §3）。 */
export function MaterialForm({ classifications, material }: MaterialFormProps) {
  const isEdit = material !== null;

  const [state, formAction] = useActionState(
    isEdit ? updateMaterialAction : createMaterialAction,
    initialMaterialFormState,
  );

  const { errors, classificationError } = useMemo((): FormErrorState => {
    if (state.status !== "error" || state.fieldErrors === undefined) {
      return { errors: undefined, classificationError: undefined };
    }

    const { classifications, ...fieldErrors } = state.fieldErrors;

    return { errors: fieldErrors, classificationError: classifications };
  }, [state]);

  const form = useForm({
    defaultValues: {
      name: material?.name ?? "",
      manufacturerName: material?.manufacturer_name ?? "",
      compositionTypeId: material?.composition_type_id ?? "",
      salesStatus: material?.sales_status ?? "",
      description: material?.description ?? "",
      generalUse: material?.general_use ?? "",
      mainComponents: material?.main_components ?? "",
      mechanism: material?.mechanism ?? "",
      priceRange: material?.price_range ?? "",
      usageText: material?.usage_text ?? "",
      officialUrl: material?.official_url ?? "",
      catalogUrl: material?.catalog_url ?? "",
      cropIds: material?.cropIds ?? [],
      effectIds: material?.effectIds ?? [],
      ingredientCategoryIds: material?.ingredientCategoryIds ?? [],
      ingredientIds: material?.ingredientIds ?? [],
      searchTagIds: material?.searchTagIds ?? [],
    },
  });

  const values = useStore(form.store, (state) => state.values);

  return (
    <Form
      action={formAction}
      className={formStyle}
      errors={errors}
      persist="material"
      onRestore={(restored) => {
        for (const name of [
          "name",
          "manufacturerName",
          "compositionTypeId",
          "salesStatus",
          "description",
          "generalUse",
          "mainComponents",
          "mechanism",
          "priceRange",
          "usageText",
          "officialUrl",
          "catalogUrl",
        ] as const) {
          const value = restored.get(name)?.[0];

          if (value !== undefined) form.setFieldValue(name, value);
        }

        for (const name of [
          "cropIds",
          "effectIds",
          "ingredientCategoryIds",
          "ingredientIds",
          "searchTagIds",
        ] as const) {
          const value = restored.get(name);

          if (value !== undefined) form.setFieldValue(name, [...value]);
        }
      }}
    >
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}
      {isEdit ? <input name="materialId" type="hidden" value={material.id} /> : null}
      {/* 表示対象外の既存分類は、別の情報を保存しても失わない。 */}
      {(material?.productTypeIds ?? []).map((id) => (
        <input key={id} name="productTypeIds" type="hidden" value={id} />
      ))}

      <p className={groupTitleStyle}>分類・検索層（Farmille 所有）</p>
      <div className={adminFieldGridStyle}>
        <Input
          label="資材名"
          name="name"
          requirement="required"
          value={values.name}
          onChange={(event) => form.setFieldValue("name", event.target.value)}
        />
        <Input
          description="未 claim でも表示するマスタ由来の表示名。"
          label="メーカー名"
          name="manufacturerName"
          requirement="required"
          value={values.manufacturerName}
          onChange={(event) => form.setFieldValue("manufacturerName", event.target.value)}
        />
        <Select
          label="組成タイプ"
          name="compositionTypeId"
          requirement="optional"
          value={values.compositionTypeId}
          onValueChange={(value) => form.setFieldValue("compositionTypeId", value ?? "")}
          options={[
            { value: "", label: "未設定" },
            ...classifications.compositionTypes.map((option) => ({
              value: option.id,
              label: option.name,
            })),
          ]}
        />
        <Input
          label="販売状況"
          name="salesStatus"
          requirement="optional"
          value={values.salesStatus}
          onChange={(event) => form.setFieldValue("salesStatus", event.target.value)}
        />
      </div>

      <Fieldset error={classificationError} legend="効果" requirement="optional">
        {classifications.effectCategories.map((category) => (
          <ClassificationGroup
            items={classifications.effects.filter((effect) => effect.categoryId === category.id)}
            key={category.id}
            legend={category.name}
            name="effectIds"
            selectedIds={values.effectIds}
            onValueChange={(ids) => form.setFieldValue("effectIds", ids)}
          />
        ))}
      </Fieldset>

      <Fieldset legend="対象作物（Farmille正規化）" requirement="optional">
        {[...new Set(classifications.crops.map((crop) => crop.groupId))].map((groupId) => {
          const crops = classifications.crops.filter((crop) => crop.groupId === groupId);
          const [first] = crops;

          if (first === undefined) return null;

          return (
            <ClassificationGroup
              items={crops}
              key={groupId}
              legend={first.groupName}
              name="cropIds"
              selectedIds={values.cropIds}
              onValueChange={(ids) => form.setFieldValue("cropIds", ids)}
            />
          );
        })}
      </Fieldset>

      <CheckboxGroup
        label="資材ジャンル（JBSA材料8分類）"
        name="ingredientCategoryIds"
        requirement="optional"
        value={values.ingredientCategoryIds}
        onValueChange={(ids) => form.setFieldValue("ingredientCategoryIds", ids)}
        options={classifications.ingredientCategories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
        variant="chips"
      />

      <Fieldset legend="個別材料" requirement="optional">
        {classifications.ingredientCategories.map((category) => (
          <ClassificationGroup
            items={classifications.ingredients.filter(
              (ingredient) => ingredient.categoryId === category.id,
            )}
            key={category.id}
            legend={category.name}
            name="ingredientIds"
            selectedIds={values.ingredientIds}
            onValueChange={(ids) => form.setFieldValue("ingredientIds", ids)}
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
            selectedIds={values.searchTagIds}
            onValueChange={(ids) => form.setFieldValue("searchTagIds", ids)}
          />
        ))}
      </Fieldset>

      <p className={groupTitleStyle}>
        一次情報層（claim 済みメーカーが編集する。ここでは初期値を入れる）
      </p>
      <Textarea
        label="紹介文"
        name="description"
        requirement="optional"
        value={values.description}
        onChange={(event) => form.setFieldValue("description", event.target.value)}
        rows={4}
      />
      <Textarea
        label="一般用途"
        name="generalUse"
        requirement="optional"
        value={values.generalUse}
        onChange={(event) => form.setFieldValue("generalUse", event.target.value)}
        rows={4}
      />
      <div className={adminFieldGridStyle}>
        <Input
          label="主成分"
          name="mainComponents"
          requirement="optional"
          value={values.mainComponents}
          onChange={(event) => form.setFieldValue("mainComponents", event.target.value)}
        />
        <Input
          label="作用機作"
          name="mechanism"
          requirement="optional"
          value={values.mechanism}
          onChange={(event) => form.setFieldValue("mechanism", event.target.value)}
        />
        <Input
          label="価格帯"
          name="priceRange"
          requirement="optional"
          value={values.priceRange}
          onChange={(event) => form.setFieldValue("priceRange", event.target.value)}
        />
      </div>
      <Textarea
        label="使い方"
        name="usageText"
        requirement="optional"
        value={values.usageText}
        onChange={(event) => form.setFieldValue("usageText", event.target.value)}
        rows={4}
      />
      <div className={adminFieldGridStyle}>
        <Input
          label="公式 URL"
          name="officialUrl"
          requirement="optional"
          value={values.officialUrl}
          onChange={(event) => form.setFieldValue("officialUrl", event.target.value)}
        />
        <Input
          label="カタログ URL"
          name="catalogUrl"
          requirement="optional"
          value={values.catalogUrl}
          onChange={(event) => form.setFieldValue("catalogUrl", event.target.value)}
        />
      </div>

      <FormActions layout="row">
        <SubmitButton pendingLabel={isEdit ? "保存中…" : "登録中…"}>
          {isEdit ? "保存する" : "登録する"}
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
