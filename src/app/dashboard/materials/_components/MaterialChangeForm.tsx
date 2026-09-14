"use client";

import { useActionState } from "react";

import {
  submitMaterialCreateAction,
  submitMaterialUpdateAction,
} from "@/app/dashboard/materials/actions";
import {
  initialSellerFormState,
  sellerFieldErrors,
} from "@/app/dashboard/materials/_components/form-state";
import { FormMessage, Input, PendingButton, Select, Textarea } from "@/components";
import { Field } from "@/components/auth/Fields";
import type { ClassificationOptions } from "@/server/queries/classifications";
import type { SellerMaterialDetail } from "@/server/queries/seller-dashboard";
import { css } from "../../../../../styled-system/css";

const formStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "5",
});

const sectionTitleStyle = css({
  fontSize: "lg",
  fontWeight: "700",
  color: "text.strong",
  pt: "2",
});

const fieldGridStyle = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "4",
  tab: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
});

const chipGridStyle = css({ display: "flex", flexWrap: "wrap", gap: "2" });

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

const groupStyle = css({ display: "flex", flexDirection: "column", gap: "2", mb: "3" });
const groupNameStyle = css({ fontSize: "sm", fontWeight: "700", color: "text.subtle" });

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
    <div className={chipGridStyle}>
      {options.map((option) => (
        <label className={chipLabelStyle} key={option.id}>
          <input
            defaultChecked={selectedIds.has(option.id)}
            name={name}
            type="checkbox"
            value={option.id}
          />
          {option.name}
        </label>
      ))}
    </div>
  );
}

type MaterialChangeFormProps = {
  classifications: ClassificationOptions;
  manufacturerName: string;
  material: SellerMaterialDetail | null;
};

/** 新規登録と情報変更で共有する、メーカー向けの資材スナップショット入力。 */
export function MaterialChangeForm({
  classifications,
  manufacturerName,
  material,
}: MaterialChangeFormProps) {
  const action =
    material === null
      ? submitMaterialCreateAction
      : submitMaterialUpdateAction.bind(null, material.id);
  const [state, formAction] = useActionState(action, initialSellerFormState);
  const fieldErrors = sellerFieldErrors(state);
  const selectedCropIds = new Set(material?.targetCrops.map(({ id }) => id) ?? []);
  const selectedEffectIds = new Set(material?.effects.map(({ id }) => id) ?? []);
  const selectedIngredientCategoryIds = new Set(
    material?.ingredientCategories.map(({ id }) => id) ?? [],
  );
  const selectedIngredientIds = new Set(material?.ingredients.map(({ id }) => id) ?? []);
  const selectedProductTypeIds = new Set(material?.productTypes.map(({ id }) => id) ?? []);
  const selectedSearchTagIds = new Set(material?.searchTags.map(({ id }) => id) ?? []);

  return (
    <form action={formAction} className={formStyle} noValidate>
      <h2 className={sectionTitleStyle}>基本情報</h2>
      <div className={fieldGridStyle}>
        <Field error={fieldErrors.name} htmlFor="name" label="資材名" requirement="required">
          <Input defaultValue={material?.name ?? ""} id="name" name="name" required />
        </Field>
        <Field
          guide="メーカーアカウントの正式名称を使います。"
          htmlFor="manufacturerName"
          label="メーカー名"
          requirement="required"
        >
          <Input
            defaultValue={manufacturerName}
            id="manufacturerName"
            name="manufacturerName"
            readOnly
            required
          />
        </Field>
        <Field
          error={fieldErrors.compositionTypeId}
          htmlFor="compositionTypeId"
          label="組成タイプ"
          requirement="optional"
        >
          <Select
            defaultValue={material?.composition_type_id ?? ""}
            id="compositionTypeId"
            name="compositionTypeId"
          >
            <option value="">未設定</option>
            {classifications.compositionTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="salesStatus" label="販売状況" requirement="optional">
          <Input
            defaultValue={material?.sales_status ?? ""}
            id="salesStatus"
            name="salesStatus"
            placeholder="例）販売中"
          />
        </Field>
      </div>

      <Field error={fieldErrors.classifications} label="効果" requirement="optional">
        <div>
          {classifications.effectCategories.map((category) => (
            <div className={groupStyle} key={category.id}>
              <span className={groupNameStyle}>{category.name}</span>
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

      <Field label="対象作物" requirement="optional">
        <div>
          {[...new Set(classifications.crops.map((crop) => crop.groupId))].map((groupId) => {
            const crops = classifications.crops.filter((crop) => crop.groupId === groupId);
            return (
              <div className={groupStyle} key={groupId}>
                <span className={groupNameStyle}>{crops[0]?.groupName}</span>
                <CheckboxGroup name="cropIds" options={crops} selectedIds={selectedCropIds} />
              </div>
            );
          })}
        </div>
      </Field>

      <Field label="JBSA材料分類" requirement="optional">
        <CheckboxGroup
          name="ingredientCategoryIds"
          options={classifications.ingredientCategories}
          selectedIds={selectedIngredientCategoryIds}
        />
      </Field>

      <Field label="個別材料" requirement="optional">
        <div>
          {classifications.ingredientCategories.map((category) => (
            <div className={groupStyle} key={category.id}>
              <span className={groupNameStyle}>{category.name}</span>
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

      <Field label="製品タイプ" requirement="optional">
        <CheckboxGroup
          name="productTypeIds"
          options={classifications.productTypes}
          selectedIds={selectedProductTypeIds}
        />
      </Field>

      <Field label="検索補助タグ" requirement="optional">
        <div>
          {(["concern", "condition"] as const).map((category) => (
            <div className={groupStyle} key={category}>
              <span className={groupNameStyle}>
                {category === "concern" ? "悩み" : "条件・使い方"}
              </span>
              <CheckboxGroup
                name="searchTagIds"
                options={classifications.searchTags.filter((tag) => tag.category === category)}
                selectedIds={selectedSearchTagIds}
              />
            </div>
          ))}
        </div>
      </Field>

      <h2 className={sectionTitleStyle}>メーカー一次情報</h2>
      <Field htmlFor="description" label="紹介文" requirement="optional">
        <Textarea
          defaultValue={material?.description ?? ""}
          id="description"
          name="description"
          size="lg"
        />
      </Field>
      <Field htmlFor="generalUse" label="一般用途" requirement="optional">
        <Textarea defaultValue={material?.general_use ?? ""} id="generalUse" name="generalUse" />
      </Field>
      <div className={fieldGridStyle}>
        <Field htmlFor="mainComponents" label="主成分" requirement="optional">
          <Input
            defaultValue={material?.main_components ?? ""}
            id="mainComponents"
            name="mainComponents"
          />
        </Field>
        <Field htmlFor="mechanism" label="作用機序" requirement="optional">
          <Input defaultValue={material?.mechanism ?? ""} id="mechanism" name="mechanism" />
        </Field>
        <Field htmlFor="priceRange" label="価格帯" requirement="optional">
          <Input defaultValue={material?.price_range ?? ""} id="priceRange" name="priceRange" />
        </Field>
      </div>
      <Field htmlFor="usageText" label="使い方" requirement="optional">
        <Textarea
          defaultValue={material?.usage_text ?? ""}
          id="usageText"
          name="usageText"
          size="lg"
        />
      </Field>
      <div className={fieldGridStyle}>
        <Field
          error={fieldErrors.officialUrl}
          htmlFor="officialUrl"
          label="公式URL"
          requirement="optional"
        >
          <Input
            defaultValue={material?.official_url ?? ""}
            id="officialUrl"
            name="officialUrl"
            type="url"
          />
        </Field>
        <Field
          error={fieldErrors.catalogUrl}
          htmlFor="catalogUrl"
          label="カタログURL"
          requirement="optional"
        >
          <Input
            defaultValue={material?.catalog_url ?? ""}
            id="catalogUrl"
            name="catalogUrl"
            type="url"
          />
        </Field>
      </div>

      <Field
        guide="運営が確認するときに参考にします。"
        htmlFor="reason"
        label="申請メモ"
        requirement="optional"
      >
        <Textarea id="reason" name="reason" placeholder="変更理由や補足資料など" />
      </Field>

      {state.status === "idle" ? null : (
        <FormMessage status={state.status}>{state.message}</FormMessage>
      )}
      <PendingButton
        label={material === null ? "新規登録を申請" : "変更を申請"}
        pendingLabel="申請中…"
      />
    </form>
  );
}
