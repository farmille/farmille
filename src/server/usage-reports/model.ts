import * as v from "valibot";

export const PURPOSE_GROUPS = [
  {
    label: "吸収・光合成",
    options: [
      "養分吸収の改善",
      "水分吸収の改善",
      "酸素の供給効率の改善",
      "CO2の供給効率の改善",
      "養分の利用効率の改善",
      "光合成改善",
    ],
  },
  {
    label: "環境ストレス耐性",
    options: [
      "耐暑性改善",
      "耐寒性改善",
      "耐乾燥性改善",
      "湿害からの回復改善",
      "低照度下での生育改善",
      "塩害耐性改善",
      "遮光効果",
      "耐霜性改善",
      "環境ストレス耐性を高める",
    ],
  },
  {
    label: "収量・品質",
    options: ["収量改善", "秀品率の改善", "有用成分（栄養成分・機能性成分）の改善", "糖度増加"],
  },
  {
    label: "生育・回復",
    options: [
      "細胞壁の強化",
      "樹勢改善",
      "成り疲れ改善",
      "外部損傷の修復",
      "しおれ軽減",
      "根圏の有用微生物の活性化",
    ],
  },
] as const;

export const PURPOSE_OPTIONS = PURPOSE_GROUPS.flatMap(({ options }) => options);

export const CULTIVATION_TYPES = [
  { value: "open_field", label: "露地栽培" },
  { value: "facility", label: "施設栽培" },
  { value: "other", label: "その他" },
] as const;

export type CultivationType = (typeof CULTIVATION_TYPES)[number]["value"];

export const CULTIVATION_FEATURES = {
  all: [
    "土耕",
    "養液土耕",
    "水耕",
    "固形培地",
    "ハウス",
    "ガラス室",
    "雨よけ",
    "トンネル",
    "べたがけ",
    "加温",
    "無加温",
    "高設栽培",
    "鉢・ポット",
    "マルチ",
    "点滴灌水",
    "環境制御",
    "人工光",
  ],
  open_field: ["土耕", "雨よけ", "トンネル", "べたがけ", "マルチ", "点滴灌水"],
  facility: [
    "ハウス",
    "ガラス室",
    "加温",
    "無加温",
    "土耕",
    "養液土耕",
    "水耕",
    "固形培地",
    "高設栽培",
    "環境制御",
    "人工光",
  ],
  other: [],
} as const;

export const STAGE_SETS = {
  fruit_vegetable: [
    "播種・育苗期",
    "定植・活着期",
    "栄養生長期",
    "開花・着果期",
    "果実肥大期",
    "収穫期",
    "収穫終了後",
  ],
  leaf_vegetable: ["播種・育苗期", "定植期", "生育期（展葉・結球）", "収穫期"],
  root_vegetable: ["播種・植付期", "生育初期", "根部・地下部肥大期", "収穫期"],
  fruit_tree: [
    "萌芽期",
    "開花期",
    "生理落果期",
    "果実肥大期",
    "着色・成熟期",
    "収穫期",
    "収穫後・休眠期",
  ],
  grain: ["播種・育苗期", "移植期", "分げつ期", "幼穂形成期", "出穂・開花期", "登熟期", "収穫期"],
} as const;

export type StageSetKey = keyof typeof STAGE_SETS;

const GROUP_STAGE_SET = new Map<string, StageSetKey>([
  ["なす科果菜類", "fruit_vegetable"],
  ["うり類", "fruit_vegetable"],
  ["ベリー類等の小粒果実類", "fruit_vegetable"],
  ["あぶらな科野菜", "leaf_vegetable"],
  ["葉菜類", "leaf_vegetable"],
  ["根菜類", "root_vegetable"],
  ["いも類", "root_vegetable"],
  ["鱗茎類", "root_vegetable"],
  ["かんきつ類", "fruit_tree"],
  ["仁果類", "fruit_tree"],
  ["核果類", "fruit_tree"],
  ["穀類", "grain"],
]);

export function stageSetForGroup(groupName: string): readonly string[] {
  return STAGE_SETS[GROUP_STAGE_SET.get(groupName) ?? "fruit_vegetable"];
}

export const APPLICATION_METHODS = [
  { value: "spray", label: "葉・茎・果実に散布" },
  { value: "soil", label: "根・土壌・培地に施用" },
  { value: "seed", label: "種子・苗に処理" },
  { value: "other", label: "その他・複数の方法" },
] as const;

export type ApplicationMethod = (typeof APPLICATION_METHODS)[number]["value"];

export const MEDIA_PLACEMENTS = [
  { value: "observation", label: "観察した変化" },
  { value: "cover", label: "冒頭（カバー）" },
  { value: "method", label: "使用方法" },
  { value: "harvest", label: "収穫調査" },
  { value: "summary", label: "まとめ・感想" },
] as const;

export type MediaPlacement = (typeof MEDIA_PLACEMENTS)[number]["value"];
export type ReportMediaType = "photo" | "video";

const STORED_MEDIA_PLACEMENTS = [
  ...MEDIA_PLACEMENTS,
  { value: "treated", label: "処理区" },
  { value: "untreated", label: "対照区" },
] as const;

/** 保存済みの配置コードを運営画面向けの表示名へ変換する。 */
export function mediaPlacementLabel(placement: string | null): string | null {
  if (placement === null) return null;

  const option = STORED_MEDIA_PLACEMENTS.find(({ value }) => value === placement);
  if (option === undefined) {
    throw new Error(`未対応のメディア配置です：${placement}`);
  }

  return option.label;
}

const ReportTextSchema = v.pipe(v.string(), v.maxLength(20_000));
const ReportTextArraySchema = v.pipe(v.array(ReportTextSchema), v.maxLength(50));

export const ComparisonInputSchema = v.strictObject({
  enabled: v.boolean(),
  otherBsUse: v.picklist(["", "no", "yes"]),
  otherBsName: ReportTextSchema,
  simultaneousInputs: ReportTextSchema,
  otherConditionDifference: ReportTextSchema,
  sampleCount: ReportTextSchema,
  sampleUnit: ReportTextSchema,
});

export const MetricInputSchema = v.strictObject({
  key: ReportTextSchema,
  metricName: ReportTextSchema,
  untreatedValue: ReportTextSchema,
  treatedValue: ReportTextSchema,
  unit: ReportTextSchema,
});

export const CropReportInputSchema = v.strictObject({
  cropId: ReportTextSchema,
  observedChange: ReportTextSchema,
  negativeNote: ReportTextSchema,
  purposeTags: v.pipe(v.array(ReportTextSchema), v.maxLength(PURPOSE_OPTIONS.length)),
  purposeNote: ReportTextSchema,
  prefectureCode: ReportTextSchema,
  fieldName: ReportTextSchema,
  variety: ReportTextSchema,
  plantingDate: ReportTextSchema,
  cultivationType: v.picklist(["", "open_field", "facility", "other"]),
  cultivationTags: v.pipe(v.array(ReportTextSchema), v.maxLength(CULTIVATION_FEATURES.all.length)),
  growthStage: ReportTextSchema,
  growthStageNote: ReportTextSchema,
  climateEnabled: v.boolean(),
  climateNote: ReportTextSchema,
  applicationDates: ReportTextArraySchema,
  applicationMethod: v.picklist(["", "spray", "soil", "seed", "other"]),
  sprayDilutionValue: ReportTextSchema,
  sprayDilutionUnit: ReportTextSchema,
  sprayAmountValue: ReportTextSchema,
  sprayAmountUnit: ReportTextSchema,
  sprayArea: ReportTextSchema,
  soilMethod: ReportTextSchema,
  soilDilutionValue: ReportTextSchema,
  soilDilutionUnit: ReportTextSchema,
  soilAmountValue: ReportTextSchema,
  soilAmountUnit: ReportTextSchema,
  soilArea: ReportTextSchema,
  seedMethod: ReportTextSchema,
  seedDilutionValue: ReportTextSchema,
  seedDilutionUnit: ReportTextSchema,
  seedAmountValue: ReportTextSchema,
  seedAmountUnit: ReportTextSchema,
  seedDurationNote: ReportTextSchema,
  otherMethodDetail: ReportTextSchema,
  comparison: ComparisonInputSchema,
  metricsEnabled: v.boolean(),
  researchPeriod: ReportTextSchema,
  metrics: v.pipe(v.array(MetricInputSchema), v.maxLength(20)),
});

export const ReportMediaInputSchema = v.strictObject({
  key: v.pipe(v.string(), v.maxLength(200)),
  url: v.pipe(v.string(), v.maxLength(2_000)),
  mediaType: v.picklist(["photo", "video"]),
  placement: v.picklist(["observation", "cover", "method", "harvest", "summary"]),
  caption: ReportTextSchema,
});

export const UsageReportFormPayloadSchema = v.strictObject({
  cropReports: v.pipe(v.array(CropReportInputSchema), v.maxLength(12)),
  media: v.pipe(v.array(ReportMediaInputSchema), v.maxLength(20)),
  summary: ReportTextSchema,
  pesticideAck: v.boolean(),
});

export type ComparisonInput = v.InferOutput<typeof ComparisonInputSchema>;
export type MetricInput = v.InferOutput<typeof MetricInputSchema>;
export type CropReportInput = v.InferOutput<typeof CropReportInputSchema>;
export type ReportMediaInput = v.InferOutput<typeof ReportMediaInputSchema>;
export type UsageReportFormPayload = v.InferOutput<typeof UsageReportFormPayloadSchema>;

export const UsageReportFieldErrorsSchema = v.record(v.string(), v.string());
export const UsageReportActionResultSchema = v.variant("ok", [
  v.strictObject({
    ok: v.literal(true),
    status: v.picklist(["draft", "pending"]),
    reportIds: v.array(v.pipe(v.string(), v.uuid())),
    message: v.string(),
  }),
  v.strictObject({
    ok: v.literal(false),
    message: v.string(),
    fieldErrors: UsageReportFieldErrorsSchema,
  }),
]);

export type UsageReportFieldErrors = v.InferOutput<typeof UsageReportFieldErrorsSchema>;
export type UsageReportActionResult = v.InferOutput<typeof UsageReportActionResultSchema>;

export function createBlankMetric(): MetricInput {
  return {
    key: crypto.randomUUID(),
    metricName: "",
    untreatedValue: "",
    treatedValue: "",
    unit: "",
  };
}

export function createBlankCropReport(cropId: string): CropReportInput {
  return {
    cropId,
    observedChange: "",
    negativeNote: "",
    purposeTags: [],
    purposeNote: "",
    prefectureCode: "",
    fieldName: "",
    variety: "",
    plantingDate: "",
    cultivationType: "",
    cultivationTags: [],
    growthStage: "",
    growthStageNote: "",
    climateEnabled: false,
    climateNote: "",
    applicationDates: [],
    applicationMethod: "",
    sprayDilutionValue: "",
    sprayDilutionUnit: "倍",
    sprayAmountValue: "",
    sprayAmountUnit: "L/10a",
    sprayArea: "",
    soilMethod: "",
    soilDilutionValue: "",
    soilDilutionUnit: "倍",
    soilAmountValue: "",
    soilAmountUnit: "mL/株",
    soilArea: "",
    seedMethod: "",
    seedDilutionValue: "",
    seedDilutionUnit: "倍",
    seedAmountValue: "",
    seedAmountUnit: "kg種子",
    seedDurationNote: "",
    otherMethodDetail: "",
    comparison: {
      enabled: false,
      otherBsUse: "",
      otherBsName: "",
      simultaneousInputs: "",
      otherConditionDifference: "",
      sampleCount: "",
      sampleUnit: "株",
    },
    metricsEnabled: false,
    researchPeriod: "",
    metrics: [createBlankMetric()],
  };
}
