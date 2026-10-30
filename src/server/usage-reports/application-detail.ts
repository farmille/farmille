import { CULTIVATION_TYPES, type CultivationType } from "@/server/usage-reports/model";

export function cultivationTypeFromLabel(label: string | null): CultivationType | "" {
  if (label === null) return "";

  const option = CULTIVATION_TYPES.find((type) => type.label === label || type.value === label);

  if (option === undefined) {
    throw new Error(`未対応の栽培形態です：${label}`);
  }

  return option.value;
}

export function cultivationTypeLabel(type: CultivationType | ""): string | null {
  return CULTIVATION_TYPES.find((candidate) => candidate.value === type)?.label ?? null;
}

/** 保存済みの日本語名と旧コードの両方を運営画面用の日本語名へ揃える。 */
export function cultivationTypeDisplayLabel(value: string | null): string | null {
  if (value === null) return null;

  const type = cultivationTypeFromLabel(value);
  const label = cultivationTypeLabel(type);

  if (label === null) {
    throw new Error(`未対応の栽培形態です：${value}`);
  }

  return label;
}
