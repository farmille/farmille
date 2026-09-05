import * as v from "valibot";

import { trimmedFormDataString } from "@/lib/validation";
import type { Database } from "@/types/database.types";

export type MaterialInput = {
  name: string;
  manufacturerName: string;
  compositionTypeId: string | null;
  salesStatus: string | null;
  description: string | null;
  generalUse: string | null;
  mainComponents: string | null;
  mechanism: string | null;
  usageText: string | null;
  priceRange: string | null;
  officialUrl: string | null;
  catalogUrl: string | null;
  cropIds: string[];
  effectIds: string[];
  ingredientCategoryIds: string[];
  ingredientIds: string[];
  productTypeIds: string[];
  searchTagIds: string[];
};

export type MaterialFieldErrors = Partial<
  Record<
    | "name"
    | "manufacturerName"
    | "officialUrl"
    | "catalogUrl"
    | "compositionTypeId"
    | "classifications",
    string
  >
>;

export type MaterialValidation =
  | { ok: true; input: MaterialInput }
  | { ok: false; fieldErrors: MaterialFieldErrors };

function toOptionalText(value: FormDataEntryValue | null): string | null {
  const text = trimmedFormDataString(value);
  return text.length === 0 ? null : text;
}

type UrlParse = { ok: true; value: string | null } | { ok: false };

function toOptionalHttpUrl(value: FormDataEntryValue | null): UrlParse {
  const text = trimmedFormDataString(value);
  if (text.length === 0) return { ok: true, value: null };

  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false };
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false };
  }
}

/** 運営の直接編集とメーカー申請が共有する資材入力境界。 */
export function validateMaterialInput(raw: {
  name: FormDataEntryValue | null;
  manufacturerName: FormDataEntryValue | null;
  compositionTypeId: FormDataEntryValue | null;
  salesStatus: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  generalUse: FormDataEntryValue | null;
  mainComponents: FormDataEntryValue | null;
  mechanism: FormDataEntryValue | null;
  usageText: FormDataEntryValue | null;
  priceRange: FormDataEntryValue | null;
  officialUrl: FormDataEntryValue | null;
  catalogUrl: FormDataEntryValue | null;
  cropIds: readonly FormDataEntryValue[];
  effectIds: readonly FormDataEntryValue[];
  ingredientCategoryIds: readonly FormDataEntryValue[];
  ingredientIds: readonly FormDataEntryValue[];
  productTypeIds: readonly FormDataEntryValue[];
  searchTagIds: readonly FormDataEntryValue[];
}): MaterialValidation {
  const fieldErrors: MaterialFieldErrors = {};
  const name = trimmedFormDataString(raw.name);
  const manufacturerName = trimmedFormDataString(raw.manufacturerName);

  if (name.length === 0) fieldErrors.name = "資材名を入力してください。";
  if (manufacturerName.length === 0) {
    fieldErrors.manufacturerName = "メーカー名を入力してください。";
  }

  const officialUrl = toOptionalHttpUrl(raw.officialUrl);
  const catalogUrl = toOptionalHttpUrl(raw.catalogUrl);
  if (!officialUrl.ok) fieldErrors.officialUrl = "http(s) の URL で入力してください。";
  if (!catalogUrl.ok) fieldErrors.catalogUrl = "http(s) の URL で入力してください。";

  const compositionTypeIdText = trimmedFormDataString(raw.compositionTypeId);
  const compositionTypeIdResult = v.safeParse(
    v.union([v.literal(""), v.pipe(v.string(), v.uuid())]),
    compositionTypeIdText,
  );
  if (!compositionTypeIdResult.success) {
    fieldErrors.compositionTypeId = "組成タイプの選択内容が正しくありません。";
  }

  const idListSchema = v.array(v.pipe(v.string(), v.uuid()));
  const cropIdsResult = v.safeParse(idListSchema, raw.cropIds);
  const effectIdsResult = v.safeParse(idListSchema, raw.effectIds);
  const ingredientCategoryIdsResult = v.safeParse(idListSchema, raw.ingredientCategoryIds);
  const ingredientIdsResult = v.safeParse(idListSchema, raw.ingredientIds);
  const productTypeIdsResult = v.safeParse(idListSchema, raw.productTypeIds);
  const searchTagIdsResult = v.safeParse(idListSchema, raw.searchTagIds);
  const classificationResults = [
    cropIdsResult,
    effectIdsResult,
    ingredientCategoryIdsResult,
    ingredientIdsResult,
    productTypeIdsResult,
    searchTagIdsResult,
  ];
  if (classificationResults.some((result) => !result.success)) {
    fieldErrors.classifications = "分類の選択内容が正しくありません。";
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    !compositionTypeIdResult.success ||
    !cropIdsResult.success ||
    !effectIdsResult.success ||
    !ingredientCategoryIdsResult.success ||
    !ingredientIdsResult.success ||
    !productTypeIdsResult.success ||
    !searchTagIdsResult.success
  ) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      name,
      manufacturerName,
      compositionTypeId:
        compositionTypeIdResult.output.length === 0 ? null : compositionTypeIdResult.output,
      salesStatus: toOptionalText(raw.salesStatus),
      description: toOptionalText(raw.description),
      generalUse: toOptionalText(raw.generalUse),
      mainComponents: toOptionalText(raw.mainComponents),
      mechanism: toOptionalText(raw.mechanism),
      usageText: toOptionalText(raw.usageText),
      priceRange: toOptionalText(raw.priceRange),
      officialUrl: officialUrl.ok ? officialUrl.value : null,
      catalogUrl: catalogUrl.ok ? catalogUrl.value : null,
      cropIds: cropIdsResult.output,
      effectIds: effectIdsResult.output,
      ingredientCategoryIds: ingredientCategoryIdsResult.output,
      ingredientIds: ingredientIdsResult.output,
      productTypeIds: productTypeIdsResult.output,
      searchTagIds: searchTagIdsResult.output,
    },
  };
}

export function materialInputToRow(
  input: MaterialInput,
): Database["public"]["Tables"]["materials"]["Insert"] {
  return {
    name: input.name,
    manufacturer_name: input.manufacturerName,
    composition_type_id: input.compositionTypeId,
    sales_status: input.salesStatus,
    description: input.description,
    general_use: input.generalUse,
    main_components: input.mainComponents,
    mechanism: input.mechanism,
    usage_text: input.usageText,
    price_range: input.priceRange,
    official_url: input.officialUrl,
    catalog_url: input.catalogUrl,
  };
}
