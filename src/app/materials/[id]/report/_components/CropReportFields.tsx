"use client";

import { useState } from "react";

import { cva, css, cx } from "../../../../../../styled-system/css";
import { CalendarPicker } from "@/components/form/CalendarPicker";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";
import { PREFECTURES } from "@/lib/prefectures";
import type { CropOption } from "@/server/queries/usage-report-form";
import {
  APPLICATION_METHODS,
  CULTIVATION_FEATURES,
  CULTIVATION_TYPES,
  PURPOSE_GROUPS,
  createBlankMetric,
  stageSetForGroup,
  type CropReportInput,
  type UsageReportFieldErrors,
} from "@/server/usage-reports/model";

import {
  Choice,
  FieldError,
  FieldLabel,
  SectionHeading,
  TogglePanel,
  choiceList,
  formStyles,
  tagButton,
} from "./FormUI";

const scopedPanel = cva({
  base: {},
  variants: {
    tabbed: {
      true: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "card",
        borderTopLeftRadius: "0",
        bg: "surface.card",
        px: "3.5",
        pb: "4",
      },
      false: {},
    },
  },
});

const purposeHeading = css({
  mt: "3.5",
  mb: "2",
  fontSize: "xs",
  fontWeight: "700",
  color: "text.subtle",
  letterSpacing: "0.03em",
});

const stageList = css({ position: "relative", py: "0.5" });

const stageLine = css({
  position: "absolute",
  left: "11px",
  top: "4",
  bottom: "4",
  w: "0.5",
  bg: "border.default",
});

const stageButton = cva({
  base: {
    position: "relative",
    zIndex: "1",
    w: "100%",
    display: "flex",
    alignItems: "center",
    gap: "3",
    borderWidth: "0",
    bg: "transparent",
    py: "1",
    px: "0",
    textAlign: "left",
    cursor: "pointer",
  },
});

const stageDot = cva({
  base: {
    w: "16px",
    h: "16px",
    ml: "0.5",
    borderRadius: "pill",
    borderWidth: "2px",
    borderStyle: "solid",
    flexShrink: "0",
  },
  variants: {
    selected: {
      true: {
        borderColor: "brand.primary",
        bg: "brand.primary",
        outlineWidth: "3px",
        outlineStyle: "solid",
        outlineColor: "brand.soft",
      },
      false: { borderColor: "border.strong", bg: "surface.card" },
    },
  },
});

const stageLabel = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "pill",
    px: "3.5",
    py: "1.5",
    fontSize: "sm",
  },
  variants: {
    selected: {
      true: {
        bg: "green.soft2",
        borderColor: "brand.soft",
        color: "brand.primaryDeep",
        fontWeight: "700",
      },
      false: {
        bg: "transparent",
        borderColor: "transparent",
        color: "text.muted",
      },
    },
  },
});

const metricCard = css({
  mt: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "button",
  bg: "surface.card",
  p: "3",
});

const metricHeader = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: "2",
  fontSize: "sm",
  fontWeight: "700",
});

const smallButton = css({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "pill",
  bg: "surface.card",
  color: "brand.primary",
  px: "3",
  py: "1.5",
  fontSize: "sm",
  fontWeight: "700",
  cursor: "pointer",
});

const removeMetricButton = css({
  borderWidth: "0",
  bg: "transparent",
  color: "text.subtle",
  fontSize: "sm",
  cursor: "pointer",
});

function errorFor(
  errors: UsageReportFieldErrors,
  cropId: string,
  field: string,
): string | undefined {
  return errors[`${cropId}.${field}`];
}

function PurposeFields({
  input,
  onChange,
  error,
}: {
  input: CropReportInput;
  onChange: (input: CropReportInput) => void;
  error?: string;
}) {
  function togglePurpose(value: string): void {
    const selected = new Set(input.purposeTags);
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    onChange({ ...input, purposeTags: [...selected] });
  }

  return (
    <div className={formStyles.field}>
      <FieldLabel required>使用目的</FieldLabel>
      <p className={formStyles.guide}>この資材に期待した効果を選んでください。複数選択できます。</p>
      {PURPOSE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className={purposeHeading}>{group.label}</p>
          <div className={formStyles.tagCloud}>
            {group.options.map((option) => (
              <button
                key={option}
                type="button"
                className={tagButton({ selected: input.purposeTags.includes(option) })}
                aria-pressed={input.purposeTags.includes(option)}
                onClick={() => togglePurpose(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Input
        className={css({ mt: "3" })}
        value={input.purposeNote}
        placeholder="補足（任意）例：灌水量を変えずに樹勢を維持したかった"
        onChange={(event) => onChange({ ...input, purposeNote: event.target.value })}
      />
      <FieldError message={error} />
    </div>
  );
}

function CultivationFeatures({
  input,
  onChange,
}: {
  input: CropReportInput;
  onChange: (input: CropReportInput) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const primary: readonly string[] =
    input.cultivationType === ""
      ? CULTIVATION_FEATURES.all
      : CULTIVATION_FEATURES[input.cultivationType];
  const rest = CULTIVATION_FEATURES.all.filter((value) => !primary.includes(value));
  const visible = expanded ? [...primary, ...rest] : primary;

  function toggleFeature(value: string): void {
    const selected = new Set(input.cultivationTags);
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    onChange({ ...input, cultivationTags: [...selected] });
  }

  return (
    <div className={formStyles.field}>
      <FieldLabel>栽培の特徴・使用技術</FieldLabel>
      <p className={formStyles.guide}>当てはまるものをすべて選択してください。</p>
      <div className={formStyles.tagCloud}>
        {visible.map((feature) => (
          <button
            key={feature}
            type="button"
            className={tagButton({ selected: input.cultivationTags.includes(feature) })}
            aria-pressed={input.cultivationTags.includes(feature)}
            onClick={() => toggleFeature(feature)}
          >
            {feature}
          </button>
        ))}
        {!expanded && rest.length > 0 ? (
          <button
            type="button"
            className={tagButton({ selected: false })}
            onClick={() => setExpanded(true)}
          >
            ＋ その他の技術
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EnvironmentFields({
  input,
  crop,
  initialMonth,
  onChange,
  errors,
}: {
  input: CropReportInput;
  crop: CropOption;
  initialMonth: string;
  onChange: (input: CropReportInput) => void;
  errors: UsageReportFieldErrors;
}) {
  const stages = stageSetForGroup(crop.groupName);

  return (
    <>
      <p className={formStyles.conditionHeading}>圃場・作物の情報（どこで・何を育てているか）</p>
      <div className={formStyles.field}>
        <FieldLabel required htmlFor={`prefecture-${crop.id}`}>
          地域
        </FieldLabel>
        <Select
          id={`prefecture-${crop.id}`}
          value={input.prefectureCode}
          onChange={(event) => onChange({ ...input, prefectureCode: event.target.value })}
        >
          <option value="">都道府県を選択</option>
          {PREFECTURES.map((prefecture) => (
            <option key={prefecture.code} value={prefecture.code}>
              {prefecture.name}
            </option>
          ))}
        </Select>
        <FieldError message={errorFor(errors, crop.id, "prefectureCode")} />
      </div>

      <div className={formStyles.field}>
        <FieldLabel htmlFor={`field-${crop.id}`}>圃場名</FieldLabel>
        <Input
          id={`field-${crop.id}`}
          value={input.fieldName}
          placeholder="例：〇〇農園 第2ハウス"
          onChange={(event) => onChange({ ...input, fieldName: event.target.value })}
        />
      </div>

      <div className={formStyles.field}>
        <FieldLabel htmlFor={`variety-${crop.id}`}>品種</FieldLabel>
        <Input
          id={`variety-${crop.id}`}
          value={input.variety}
          placeholder="例：アイコ"
          onChange={(event) => onChange({ ...input, variety: event.target.value })}
        />
      </div>

      <div className={formStyles.field}>
        <FieldLabel>定植時期</FieldLabel>
        <p className={formStyles.guide}>
          おおよその日付で構いません。公開時は「ごろ」として表示されます。
        </p>
        <CalendarPicker
          value={input.plantingDate === "" ? [] : [input.plantingDate]}
          onChange={(dates) => onChange({ ...input, plantingDate: dates[0] ?? "" })}
          initialMonth={initialMonth}
          single
          suffix="ごろ"
          emptyMessage="カレンダーから日付を選択（おおよそでOK）"
          ariaLabel="定植時期のカレンダー"
        />
        <FieldError message={errorFor(errors, crop.id, "plantingDate")} />
      </div>

      <div className={formStyles.field}>
        <FieldLabel required>栽培区分</FieldLabel>
        <div className={choiceList}>
          {CULTIVATION_TYPES.map((type) => (
            <Choice
              key={type.value}
              selected={input.cultivationType === type.value}
              onClick={() => onChange({ ...input, cultivationType: type.value })}
            >
              {type.label}
            </Choice>
          ))}
        </div>
        <FieldError message={errorFor(errors, crop.id, "cultivationType")} />
      </div>

      <CultivationFeatures input={input} onChange={onChange} />

      <div className={formStyles.field}>
        <FieldLabel required>生育ステージ</FieldLabel>
        <p className={formStyles.guide}>
          {crop.name}の生育段階から、使用したときの位置を選択してください。
        </p>
        <div className={stageList}>
          <span className={stageLine} aria-hidden />
          {stages.map((stage) => (
            <button
              key={stage}
              type="button"
              className={stageButton()}
              aria-pressed={input.growthStage === stage}
              onClick={() => onChange({ ...input, growthStage: stage })}
            >
              <span className={stageDot({ selected: input.growthStage === stage })} aria-hidden />
              <span className={stageLabel({ selected: input.growthStage === stage })}>{stage}</span>
            </button>
          ))}
        </div>
        <Input
          className={css({ mt: "2" })}
          value={input.growthStageNote}
          placeholder="補足（任意）例：第4〜6花房を収穫中"
          onChange={(event) => onChange({ ...input, growthStageNote: event.target.value })}
        />
        <FieldError message={errorFor(errors, crop.id, "growthStage")} />
      </div>

      <TogglePanel
        checked={input.climateEnabled}
        label="当時の気候・圃場の状況を詳しく書く"
        onChange={(checked) => onChange({ ...input, climateEnabled: checked })}
      >
        <Textarea
          size="lg"
          value={input.climateNote}
          placeholder="例：晴天が続き、日中のハウス内温度が35℃を超える日が増えていました。"
          onChange={(event) => onChange({ ...input, climateNote: event.target.value })}
        />
      </TogglePanel>
    </>
  );
}

function SprayFields({
  input,
  onChange,
}: {
  input: CropReportInput;
  onChange: (input: CropReportInput) => void;
}) {
  return (
    <>
      <div className={formStyles.field}>
        <FieldLabel required>希釈倍率・濃度</FieldLabel>
        <div className={formStyles.row}>
          <Input
            className={formStyles.grow}
            inputMode="decimal"
            value={input.sprayDilutionValue}
            placeholder="例：1000"
            onChange={(event) => onChange({ ...input, sprayDilutionValue: event.target.value })}
          />
          <Select
            className={formStyles.unit}
            value={input.sprayDilutionUnit}
            onChange={(event) => onChange({ ...input, sprayDilutionUnit: event.target.value })}
          >
            <option>倍</option>
            <option>mL/L</option>
            <option>g/L</option>
          </Select>
        </div>
      </div>
      <div className={formStyles.field}>
        <FieldLabel>散布量</FieldLabel>
        <p className={formStyles.guide}>わかる範囲で入力してください。</p>
        <div className={formStyles.row}>
          <Input
            className={formStyles.grow}
            inputMode="decimal"
            value={input.sprayAmountValue}
            placeholder="例：100"
            onChange={(event) => onChange({ ...input, sprayAmountValue: event.target.value })}
          />
          <Select
            className={formStyles.unit}
            value={input.sprayAmountUnit}
            onChange={(event) => onChange({ ...input, sprayAmountUnit: event.target.value })}
          >
            <option>L/10a</option>
            <option>mL/株</option>
            <option>g/10a</option>
            <option>g/m²</option>
          </Select>
        </div>
      </div>
      <div className={formStyles.field}>
        <FieldLabel htmlFor={`spray-area-${input.cropId}`}>散布した範囲</FieldLabel>
        <Input
          id={`spray-area-${input.cropId}`}
          value={input.sprayArea}
          placeholder="例：ハウス1棟のうち約100株（約1a）。隣に対照区あり"
          onChange={(event) => onChange({ ...input, sprayArea: event.target.value })}
        />
      </div>
    </>
  );
}

function SoilFields({
  input,
  onChange,
}: {
  input: CropReportInput;
  onChange: (input: CropReportInput) => void;
}) {
  return (
    <>
      <div className={formStyles.field}>
        <FieldLabel required htmlFor={`soil-method-${input.cropId}`}>
          施用方法
        </FieldLabel>
        <Select
          id={`soil-method-${input.cropId}`}
          value={input.soilMethod}
          onChange={(event) => onChange({ ...input, soilMethod: event.target.value })}
        >
          <option value="">選択してください</option>
          <option>株元に灌注</option>
          <option>点滴灌水で投入</option>
          <option>土壌に散布・混和</option>
          <option>培地・養液に投入</option>
          <option>その他</option>
        </Select>
      </div>
      <div className={formStyles.field}>
        <FieldLabel>希釈倍率・濃度</FieldLabel>
        <div className={formStyles.row}>
          <Input
            className={formStyles.grow}
            inputMode="decimal"
            value={input.soilDilutionValue}
            placeholder="例：500"
            onChange={(event) => onChange({ ...input, soilDilutionValue: event.target.value })}
          />
          <Select
            className={formStyles.unit}
            value={input.soilDilutionUnit}
            onChange={(event) => onChange({ ...input, soilDilutionUnit: event.target.value })}
          >
            <option>倍</option>
            <option>mL/L</option>
            <option>g/L</option>
          </Select>
        </div>
      </div>
      <div className={formStyles.field}>
        <FieldLabel>施用量</FieldLabel>
        <div className={formStyles.row}>
          <Input
            className={formStyles.grow}
            inputMode="decimal"
            value={input.soilAmountValue}
            placeholder="例：200"
            onChange={(event) => onChange({ ...input, soilAmountValue: event.target.value })}
          />
          <Select
            className={formStyles.unit}
            value={input.soilAmountUnit}
            onChange={(event) => onChange({ ...input, soilAmountUnit: event.target.value })}
          >
            <option>mL/株</option>
            <option>L/10a</option>
            <option>kg/10a</option>
            <option>mL/L養液</option>
          </Select>
        </div>
      </div>
      <div className={formStyles.field}>
        <FieldLabel htmlFor={`soil-area-${input.cropId}`}>施用した範囲</FieldLabel>
        <Input
          id={`soil-area-${input.cropId}`}
          value={input.soilArea}
          placeholder="例：ハウス1棟のうち約100株（約1a）"
          onChange={(event) => onChange({ ...input, soilArea: event.target.value })}
        />
      </div>
    </>
  );
}

function SeedFields({
  input,
  onChange,
}: {
  input: CropReportInput;
  onChange: (input: CropReportInput) => void;
}) {
  return (
    <>
      <div className={formStyles.field}>
        <FieldLabel required htmlFor={`seed-method-${input.cropId}`}>
          処理方法
        </FieldLabel>
        <Select
          id={`seed-method-${input.cropId}`}
          value={input.seedMethod}
          onChange={(event) => onChange({ ...input, seedMethod: event.target.value })}
        >
          <option value="">選択してください</option>
          <option>種子を液に浸漬</option>
          <option>種子に塗布・コーティング</option>
          <option>苗・根を液に浸漬</option>
          <option>育苗箱・セルトレイに処理</option>
          <option>その他</option>
        </Select>
      </div>
      <div className={formStyles.field}>
        <FieldLabel>希釈倍率・濃度</FieldLabel>
        <div className={formStyles.row}>
          <Input
            className={formStyles.grow}
            inputMode="decimal"
            value={input.seedDilutionValue}
            placeholder="例：500"
            onChange={(event) => onChange({ ...input, seedDilutionValue: event.target.value })}
          />
          <Select
            className={formStyles.unit}
            value={input.seedDilutionUnit}
            onChange={(event) => onChange({ ...input, seedDilutionUnit: event.target.value })}
          >
            <option>倍</option>
            <option>mL/L</option>
            <option>g/L</option>
          </Select>
        </div>
      </div>
      <div className={formStyles.field}>
        <FieldLabel>処理した量・時間</FieldLabel>
        <div className={formStyles.row}>
          <Input
            className={formStyles.grow}
            inputMode="decimal"
            value={input.seedAmountValue}
            placeholder="例：1"
            onChange={(event) => onChange({ ...input, seedAmountValue: event.target.value })}
          />
          <Select
            className={formStyles.unit}
            value={input.seedAmountUnit}
            onChange={(event) => onChange({ ...input, seedAmountUnit: event.target.value })}
          >
            <option>kg種子</option>
            <option>苗（本）</option>
            <option>育苗箱（箱）</option>
          </Select>
        </div>
        <Input
          className={css({ mt: "2" })}
          value={input.seedDurationNote}
          placeholder="例：30分浸漬。種子1kgあたり10mL"
          onChange={(event) => onChange({ ...input, seedDurationNote: event.target.value })}
        />
      </div>
    </>
  );
}

function ComparisonFields({
  input,
  onChange,
}: {
  input: CropReportInput;
  onChange: (input: CropReportInput) => void;
}) {
  const comparison = input.comparison;
  const update = (values: Partial<CropReportInput["comparison"]>) =>
    onChange({ ...input, comparison: { ...comparison, ...values } });

  return (
    <TogglePanel
      checked={comparison.enabled}
      label="比較区（資材を使っていない区画）がある"
      onChange={(enabled) => update({ enabled })}
    >
      <div className={formStyles.firstField}>
        <FieldLabel>比較区で他のBS資材を使っていますか</FieldLabel>
        <Select
          value={comparison.otherBsUse}
          onChange={(event) => update({ otherBsUse: event.target.value as "" | "no" | "yes" })}
        >
          <option value="">選択してください</option>
          <option value="no">使っていない</option>
          <option value="yes">使っている</option>
        </Select>
        {comparison.otherBsUse === "yes" ? (
          <Input
            className={css({ mt: "2" })}
            value={comparison.otherBsName}
            placeholder="資材名　例：△△液肥"
            onChange={(event) => update({ otherBsName: event.target.value })}
          />
        ) : null}
      </div>
      <div className={formStyles.field}>
        <FieldLabel>同時に使っているもの</FieldLabel>
        <Input
          value={comparison.simultaneousInputs}
          placeholder="例：液肥〇〇（週1回）、殺菌剤△△"
          onChange={(event) => update({ simultaneousInputs: event.target.value })}
        />
      </div>
      <div className={formStyles.field}>
        <FieldLabel>BS資材以外の条件差</FieldLabel>
        <Input
          value={comparison.otherConditionDifference}
          placeholder="例：なし（前作・肥料・農薬は同条件）"
          onChange={(event) => update({ otherConditionDifference: event.target.value })}
        />
      </div>
      <div className={formStyles.field}>
        <FieldLabel>調査した株数</FieldLabel>
        <div className={formStyles.row}>
          <Input
            className={formStyles.grow}
            inputMode="decimal"
            value={comparison.sampleCount}
            placeholder="例：10"
            onChange={(event) => update({ sampleCount: event.target.value })}
          />
          <Select
            className={formStyles.unit}
            value={comparison.sampleUnit}
            onChange={(event) => update({ sampleUnit: event.target.value })}
          >
            <option>株</option>
            <option>本</option>
            <option>果</option>
          </Select>
        </div>
      </div>
    </TogglePanel>
  );
}

function MetricsFields({
  input,
  onChange,
  error,
}: {
  input: CropReportInput;
  onChange: (input: CropReportInput) => void;
  error?: string;
}) {
  function updateMetric(key: string, values: Partial<CropReportInput["metrics"][number]>): void {
    onChange({
      ...input,
      metrics: input.metrics.map((metric) =>
        metric.key === key ? { ...metric, ...values } : metric,
      ),
    });
  }

  return (
    <TogglePanel
      checked={input.metricsEnabled}
      label="定量データを取得している（収量・糖度・草丈など）"
      onChange={(metricsEnabled) => onChange({ ...input, metricsEnabled })}
    >
      <div className={formStyles.firstField}>
        <FieldLabel htmlFor={`research-period-${input.cropId}`}>調査時期</FieldLabel>
        <Input
          id={`research-period-${input.cropId}`}
          value={input.researchPeriod}
          placeholder="例：2026年7月中旬〜8月上旬"
          onChange={(event) => onChange({ ...input, researchPeriod: event.target.value })}
        />
      </div>
      <p className={cx(formStyles.guide, css({ mt: "3" }))}>
        指標ごとに処理区と対照区の数値を入力してください。公開時にグラフへ反映されます。
      </p>
      {input.metrics.map((metric, index) => (
        <div key={metric.key} className={metricCard}>
          <div className={metricHeader}>
            <span>指標 {index + 1}</span>
            {input.metrics.length > 1 ? (
              <button
                type="button"
                className={removeMetricButton}
                onClick={() =>
                  onChange({
                    ...input,
                    metrics: input.metrics.filter((candidate) => candidate.key !== metric.key),
                  })
                }
              >
                削除
              </button>
            ) : null}
          </div>
          <Input
            value={metric.metricName}
            placeholder="指標名　例：1株あたり収量"
            onChange={(event) => updateMetric(metric.key, { metricName: event.target.value })}
          />
          <div
            className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2", mt: "2" })}
          >
            <Input
              inputMode="decimal"
              value={metric.untreatedValue}
              placeholder="対照区値"
              aria-label={`指標${index + 1}の対照区値`}
              onChange={(event) => updateMetric(metric.key, { untreatedValue: event.target.value })}
            />
            <Input
              inputMode="decimal"
              value={metric.treatedValue}
              placeholder="処理区値"
              aria-label={`指標${index + 1}の処理区値`}
              onChange={(event) => updateMetric(metric.key, { treatedValue: event.target.value })}
            />
          </div>
          <Input
            className={css({ mt: "2" })}
            value={metric.unit}
            placeholder="単位　例：g"
            onChange={(event) => updateMetric(metric.key, { unit: event.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        className={cx(smallButton, css({ mt: "3" }))}
        onClick={() => onChange({ ...input, metrics: [...input.metrics, createBlankMetric()] })}
      >
        ＋ 指標を追加
      </button>
      <FieldError message={error} />
    </TogglePanel>
  );
}

function ApplicationFields({
  input,
  initialMonth,
  onChange,
  errors,
}: {
  input: CropReportInput;
  initialMonth: string;
  onChange: (input: CropReportInput) => void;
  errors: UsageReportFieldErrors;
}) {
  return (
    <>
      <p className={formStyles.conditionHeading}>使い方（何をどうやったか）</p>
      <div className={formStyles.field}>
        <FieldLabel required>処理日</FieldLabel>
        <p className={formStyles.guide}>
          資材を処理した日をカレンダーから選んでください。複数選択できます。
        </p>
        <CalendarPicker
          value={input.applicationDates}
          onChange={(applicationDates) => onChange({ ...input, applicationDates })}
          initialMonth={initialMonth}
          emptyMessage="カレンダーから処理日を選択"
          ariaLabel="処理日のカレンダー"
        />
        <FieldError message={errorFor(errors, input.cropId, "applicationDates")} />
      </div>

      <div className={formStyles.field}>
        <FieldLabel required>使用方法</FieldLabel>
        <p className={formStyles.guide}>使用した方法を選ぶと、必要な入力欄が切り替わります。</p>
        <div className={choiceList}>
          {APPLICATION_METHODS.map((method) => (
            <Choice
              key={method.value}
              selected={input.applicationMethod === method.value}
              onClick={() => onChange({ ...input, applicationMethod: method.value })}
            >
              {method.label}
            </Choice>
          ))}
        </div>
        <FieldError message={errorFor(errors, input.cropId, "applicationMethod")} />
      </div>

      {input.applicationMethod !== "" ? (
        <div className={formStyles.panel}>
          {input.applicationMethod === "spray" ? (
            <SprayFields input={input} onChange={onChange} />
          ) : null}
          {input.applicationMethod === "soil" ? (
            <SoilFields input={input} onChange={onChange} />
          ) : null}
          {input.applicationMethod === "seed" ? (
            <SeedFields input={input} onChange={onChange} />
          ) : null}
          {input.applicationMethod === "other" ? (
            <div className={formStyles.field}>
              <FieldLabel required>処理した対象・方法・量</FieldLabel>
              <Textarea
                size="lg"
                value={input.otherMethodDetail}
                placeholder="例：葉面散布と株元灌注を併用。散布は1000倍で7日おき、灌注は定植時に200mL/株。"
                onChange={(event) => onChange({ ...input, otherMethodDetail: event.target.value })}
              />
            </div>
          ) : null}
          <FieldError message={errorFor(errors, input.cropId, "methodDetail")} />
        </div>
      ) : null}

      <ComparisonFields input={input} onChange={onChange} />
      <MetricsFields
        input={input}
        onChange={onChange}
        error={errorFor(errors, input.cropId, "metrics")}
      />
    </>
  );
}

export function CropReportFields({
  input,
  crop,
  initialMonth,
  tabbed,
  errors,
  onChange,
}: {
  input: CropReportInput;
  crop: CropOption;
  initialMonth: string;
  tabbed: boolean;
  errors: UsageReportFieldErrors;
  onChange: (input: CropReportInput) => void;
}) {
  return (
    <div
      className={scopedPanel({ tabbed })}
      role={tabbed ? "tabpanel" : undefined}
      aria-label={`${crop.name}の使用レポート入力`}
    >
      <SectionHeading number="1" title="使ってみて、どうでしたか？" sub="まずは結果から" first />
      <div className={formStyles.field}>
        <FieldLabel required htmlFor={`observed-${crop.id}`}>
          使用後に観察した変化
        </FieldLabel>
        <p className={formStyles.guide}>
          いつ頃から、どこに、どのような変化があったかを入力してください。明確な変化が見られなかった場合も、そのまま記入してください。
        </p>
        <Textarea
          id={`observed-${crop.id}`}
          size="lg"
          value={input.observedChange}
          placeholder="例：2回目の使用から数日後、午後の葉の萎れが使用前よりやや軽くなったように感じました。"
          onChange={(event) => onChange({ ...input, observedChange: event.target.value })}
        />
        <FieldError message={errorFor(errors, crop.id, "observedChange")} />
      </div>

      <div className={formStyles.field}>
        <FieldLabel htmlFor={`negative-${crop.id}`}>
          マイナス・良くなかった点（薬害など）
        </FieldLabel>
        <p className={formStyles.guide}>
          薬害、生育の悪化、作業負担の増加などがあれば入力してください。
        </p>
        <Textarea
          id={`negative-${crop.id}`}
          value={input.negativeNote}
          placeholder="例：特になし／散布直後に葉先が白くなったが数日で回復した"
          onChange={(event) => onChange({ ...input, negativeNote: event.target.value })}
        />
      </div>

      <SectionHeading number="2" title="くわしい条件を教えてください" sub="タップ中心で入力" />
      <PurposeFields
        input={input}
        onChange={onChange}
        error={errorFor(errors, crop.id, "purposeTags")}
      />
      <EnvironmentFields
        input={input}
        crop={crop}
        initialMonth={initialMonth}
        onChange={onChange}
        errors={errors}
      />
      <ApplicationFields
        input={input}
        initialMonth={initialMonth}
        onChange={onChange}
        errors={errors}
      />
    </div>
  );
}
