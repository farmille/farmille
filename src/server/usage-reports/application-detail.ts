import {
  APPLICATION_METHODS,
  CULTIVATION_TYPES,
  createBlankCropReport,
  type ApplicationMethod,
  type CropReportInput,
  type CultivationType,
} from "@/server/usage-reports/model";

const DETAIL_SEPARATOR = "｜";
const GROWTH_STAGE_NOTE_PREFIX = "補足：";

function line(label: string, value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : `${label}：${trimmed}`;
}

function amountLine(label: string, value: string, unit: string): string | null {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) return null;
  return `${label}：${trimmedValue}${DETAIL_SEPARATOR}${unit.trim()}`;
}

function comparisonLines(input: CropReportInput): string[] {
  if (!input.comparison.enabled) return [];

  const otherBsUse =
    input.comparison.otherBsUse === "yes"
      ? "使っている"
      : input.comparison.otherBsUse === "no"
        ? "使っていない"
        : "";

  return [
    "比較区：あり",
    line("比較区のBS資材", otherBsUse),
    line("比較区のBS資材名", input.comparison.otherBsName),
    line("同時に使っているもの", input.comparison.simultaneousInputs),
    line("BS資材以外の条件差", input.comparison.otherConditionDifference),
    amountLine("調査した株数", input.comparison.sampleCount, input.comparison.sampleUnit),
  ].filter((value): value is string => value !== null);
}

/** usage_report_applications.detail に置く、公開画面でも読める行指向の表現。 */
export function serializeApplicationDetail(input: CropReportInput): string | null {
  const lines: Array<string | null> = [];

  switch (input.applicationMethod) {
    case "spray":
      lines.push(
        amountLine("希釈倍率・濃度", input.sprayDilutionValue, input.sprayDilutionUnit),
        amountLine("散布量", input.sprayAmountValue, input.sprayAmountUnit),
        line("散布した範囲", input.sprayArea),
      );
      break;
    case "soil":
      lines.push(
        line("施用方法", input.soilMethod),
        amountLine("希釈倍率・濃度", input.soilDilutionValue, input.soilDilutionUnit),
        amountLine("施用量", input.soilAmountValue, input.soilAmountUnit),
        line("施用した範囲", input.soilArea),
      );
      break;
    case "seed":
      lines.push(
        line("処理方法", input.seedMethod),
        amountLine("希釈倍率・濃度", input.seedDilutionValue, input.seedDilutionUnit),
        amountLine("処理した量", input.seedAmountValue, input.seedAmountUnit),
        line("処理した時間・補足", input.seedDurationNote),
      );
      break;
    case "other":
      lines.push(line("処理内容", input.otherMethodDetail));
      break;
    case "":
      break;
  }

  lines.push(...comparisonLines(input));
  if (input.metricsEnabled) {
    lines.push(line("定量データの調査時期", input.researchPeriod));
  }

  const detail = lines.filter((value): value is string => value !== null).join("\n");
  return detail.length === 0 ? null : detail;
}

function detailMap(detail: string | null): Map<string, string> {
  const values = new Map<string, string>();
  if (detail === null) return values;

  for (const detailLine of detail.split("\n")) {
    const separatorIndex = detailLine.indexOf("：");
    if (separatorIndex < 0) continue;
    values.set(detailLine.slice(0, separatorIndex), detailLine.slice(separatorIndex + 1));
  }

  return values;
}

function splitAmount(value: string | undefined): [string, string] {
  if (value === undefined) return ["", ""];
  const separatorIndex = value.lastIndexOf(DETAIL_SEPARATOR);
  if (separatorIndex < 0) return [value, ""];
  return [value.slice(0, separatorIndex), value.slice(separatorIndex + 1)];
}

export function applicationMethodFromLabel(label: string | null): ApplicationMethod | "" {
  return APPLICATION_METHODS.find((method) => method.label === label)?.value ?? "";
}

export function cultivationTypeFromLabel(label: string | null): CultivationType | "" {
  return CULTIVATION_TYPES.find((type) => type.label === label)?.value ?? "";
}

export function cultivationTypeLabel(type: CultivationType | ""): string | null {
  return CULTIVATION_TYPES.find((candidate) => candidate.value === type)?.label ?? null;
}

export function applicationMethodLabel(method: ApplicationMethod | ""): string | null {
  return APPLICATION_METHODS.find((candidate) => candidate.value === method)?.label ?? null;
}

export function growthStageValue(stage: string, note: string): string | null {
  const trimmedStage = stage.trim();
  if (trimmedStage.length === 0) return null;
  const trimmedNote = note.trim();
  return trimmedNote.length === 0
    ? trimmedStage
    : `${trimmedStage}\n${GROWTH_STAGE_NOTE_PREFIX}${trimmedNote}`;
}

export type ParsedGrowthStage = {
  growthStage: string;
  growthStageNote: string;
};

export function parseGrowthStage(value: string | null): ParsedGrowthStage {
  if (value === null) return { growthStage: "", growthStageNote: "" };
  const marker = `\n${GROWTH_STAGE_NOTE_PREFIX}`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex < 0) return { growthStage: value, growthStageNote: "" };
  return {
    growthStage: value.slice(0, markerIndex),
    growthStageNote: value.slice(markerIndex + marker.length),
  };
}

export function applyApplicationDetail(
  cropId: string,
  methodLabel: string | null,
  detail: string | null,
): CropReportInput {
  const input = createBlankCropReport(cropId);
  const values = detailMap(detail);
  const method = applicationMethodFromLabel(methodLabel);
  input.applicationMethod = method;

  const dilution = splitAmount(values.get("希釈倍率・濃度"));
  const sampleCount = splitAmount(values.get("調査した株数"));

  if (method === "spray") {
    const amount = splitAmount(values.get("散布量"));
    input.sprayDilutionValue = dilution[0];
    input.sprayDilutionUnit = dilution[1] || input.sprayDilutionUnit;
    input.sprayAmountValue = amount[0];
    input.sprayAmountUnit = amount[1] || input.sprayAmountUnit;
    input.sprayArea = values.get("散布した範囲") ?? "";
  }

  if (method === "soil") {
    const amount = splitAmount(values.get("施用量"));
    input.soilMethod = values.get("施用方法") ?? "";
    input.soilDilutionValue = dilution[0];
    input.soilDilutionUnit = dilution[1] || input.soilDilutionUnit;
    input.soilAmountValue = amount[0];
    input.soilAmountUnit = amount[1] || input.soilAmountUnit;
    input.soilArea = values.get("施用した範囲") ?? "";
  }

  if (method === "seed") {
    const amount = splitAmount(values.get("処理した量"));
    input.seedMethod = values.get("処理方法") ?? "";
    input.seedDilutionValue = dilution[0];
    input.seedDilutionUnit = dilution[1] || input.seedDilutionUnit;
    input.seedAmountValue = amount[0];
    input.seedAmountUnit = amount[1] || input.seedAmountUnit;
    input.seedDurationNote = values.get("処理した時間・補足") ?? "";
  }

  if (method === "other") {
    input.otherMethodDetail = values.get("処理内容") ?? "";
  }

  input.comparison = {
    enabled: values.get("比較区") === "あり",
    otherBsUse:
      values.get("比較区のBS資材") === "使っている"
        ? "yes"
        : values.get("比較区のBS資材") === "使っていない"
          ? "no"
          : "",
    otherBsName: values.get("比較区のBS資材名") ?? "",
    simultaneousInputs: values.get("同時に使っているもの") ?? "",
    otherConditionDifference: values.get("BS資材以外の条件差") ?? "",
    sampleCount: sampleCount[0],
    sampleUnit: sampleCount[1] || input.comparison.sampleUnit,
  };

  const researchPeriod = values.get("定量データの調査時期") ?? "";
  input.metricsEnabled = researchPeriod.length > 0;
  input.researchPeriod = researchPeriod;
  return input;
}
