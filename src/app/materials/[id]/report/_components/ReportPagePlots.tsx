"use client";

import { useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Checkbox, Input, Select, Textarea } from "@/components/form";
import { Icon } from "@/components/Icon";
import { reportPlotColor } from "@/components/ReportPlotColor";
import { REPORT_PLOT_LIMIT, type UsageReportInput } from "@/lib/usage-report";
import {
  plotPlan,
  reportPlotEdits,
  reportPlotLayout,
  type ReportPlotPlan,
  type ReportPlotSeries,
} from "@/lib/usage-report-plots";

import { css, cx } from "../../../../../../styled-system/css";

import { ReportPdfReadingMark } from "./ReportPdfReadingMark";
import {
  plotMarkFields,
  REPORT_BODY_MAX,
  REPORT_SHORT_MAX,
  reportLengthNote,
} from "./report-page-state";
import { addButton, docLead, docLeadMark, labelStyle, removeButton } from "./report-page-styles";

type Plot = UsageReportInput["plots"][number];

const fieldLabel = css({ m: "0", mt: "4", fontWeight: "bold", textStyle: "body" });

const chips = css({ display: "flex", flexWrap: "wrap", gap: "1.5", mt: "1.5" });

const chipRole = css({ color: "text.muted", fontSize: "xs" });

const swatch = css({ flex: "none", w: "2.5", h: "2.5", borderRadius: "pill", bg: "currentColor" });

const adder = css({ display: "flex", alignItems: "flex-end", gap: "2", mt: "2" });

const matrixWrap = css({ mt: "1.5", overflowX: "auto" });

const matrix = css({
  borderCollapse: "collapse",
  textStyle: "supporting",
  "& th, & td": {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    px: "2",
    py: "1.5",
    textAlign: "center",
  },
  "& th": { fontWeight: "bold", color: "text.muted", overflowWrap: "anywhere" },
  "& thead th": { minW: "16", maxW: "32" },
});

const note = css({ m: "0", mt: "1.5", textStyle: "supporting", color: "text.muted" });

const groupHeading = css({ m: "0", mt: "5", fontWeight: "bold", textStyle: "body" });

const plotStyle = css({ mt: "4" });

const plotHead = css({ display: "flex", alignItems: "center", gap: "2", fontWeight: "bold" });

const dot = css({ w: "2.5", h: "2.5", borderRadius: "pill", bg: "currentColor" });

const fields = css({ pl: "4.5", mt: "1" });

const visuallyHidden = css({ srOnly: true });

const plotAdder = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
  mt: "2",
});

const plotAdderSelect = css({ flex: "[1 1 9em]", minW: "0" });

type PlotSelection = { variety: string | null; material: string | null };

const NO_VARIETY = "none";

const limitError = css({ m: "0", mt: "1.5", textStyle: "supporting", color: "accent.danger" });

/** 区の上限で断った追加。どの操作の下に案内を出すかに使う。 */
type Refusal = "品種" | "比較した資材" | "区";

const EXAMPLES = {
  untreated:
    "調査した範囲と、資材の使い方（使っていなければ「資材なし」）\n例）1区10株、3反復。資材なし。かん水と施肥は処理区と同じ。",
  used: "調査した範囲と、施用方法・希釈倍率・使用量・回数など\n例）1区10株、3反復。〇〇を1,000倍に希釈し、10aあたり200Lを葉面散布。7日おきに3回。",
  difference:
    "この区だけの違い（使っていなければ「資材なし」）\n例）1,000倍に希釈し、7日おきに3回葉面散布。",
};

/** 名前を書いて「足す」を押すと足す欄。Enter でも足す。 */
function Adder({
  label,
  placeholder,
  action,
  disabled,
  onAdd,
}: {
  label: string;
  placeholder: string;
  action: string;
  disabled: boolean;
  /** 足せたら true。断られたら書いた名前を残す。 */
  onAdd: (name: string) => boolean;
}) {
  const form = useForm({ defaultValues: { value: "" } });
  const value = useStore(form.store, (state) => state.values.value);
  const setValue = (next: string) => form.setFieldValue("value", next);

  const add = () => {
    const name = value.trim();

    if (name === "" || disabled) return;

    if (onAdd(name)) setValue("");
  };

  return (
    <div className={adder}>
      <Input
        label={label}
        hideLabel
        size="sm"
        fieldClassName={css({ flex: "1", minW: "0" })}
        placeholder={placeholder}
        maxLength={REPORT_SHORT_MAX}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          event.preventDefault();
          add();
        }}
      />
      <Button variant="ghost" size="sm" disabled={disabled || value.trim() === ""} onClick={add}>
        {action}
      </Button>
    </div>
  );
}

/** 組み合わせの表を出している間に、品種と使った資材を選んで区を1つ足す欄。量や回数だけを変えた区もここで分ける。 */
function PlotAdder({
  plan,
  onAdd,
}: {
  plan: ReportPlotPlan;
  onAdd: (varietyId: string | null, material: ReportPlotPlan["materials"][number]) => void;
}) {
  const varieties = plan.rows.map((variety) => ({
    value: variety?.id ?? NO_VARIETY,
    label: variety === null ? "品種なし" : variety.name.trim() || "（品種名未入力）",
  }));

  const defaults: PlotSelection = {
    variety: null,
    material: null,
  };

  const form = useForm({ defaultValues: defaults });
  const { variety, material } = useStore(form.store, (state) => state.values);
  const setVariety = (next: string | null) => form.setFieldValue("variety", next);
  const setMaterial = (next: string | null) => form.setFieldValue("material", next);

  // 選んでいた品種や資材を外したら、先頭の品種と投稿した資材に戻す
  const varietyValue =
    varieties.find((option) => option.value === variety)?.value ?? varieties[0]?.value;

  const chosen =
    plan.materials.find((item) => item.key === material) ??
    plan.materials.find((item) => item.treatment.kind === "posted");

  return (
    <>
      <p className={fieldLabel}>区を1つ足す</p>
      <p className={note}>
        品種と使った資材を選んで足します。同じ組み合わせで量や回数だけを変えた区も足せます。
      </p>
      <div className={plotAdder}>
        {varieties.length > 1 && (
          <Select
            label="足す区の品種"
            hideLabel
            fieldClassName={plotAdderSelect}
            options={varieties}
            value={varietyValue ?? null}
            onValueChange={setVariety}
          />
        )}
        <Select
          label="足す区で使った資材"
          hideLabel
          fieldClassName={plotAdderSelect}
          options={plan.materials.map(({ key, name }) => ({ value: key, label: name }))}
          value={chosen?.key ?? null}
          onValueChange={setMaterial}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={chosen === undefined}
          onClick={() => {
            if (chosen === undefined) return;
            onAdd(
              varietyValue === undefined || varietyValue === NO_VARIETY ? null : varietyValue,
              chosen,
            );
          }}
        >
          区を追加
        </Button>
      </div>
    </>
  );
}

/**
 * 比べた区：試した品種と使った資材を並べ、区はその組み合わせから作る。
 * 品種1つで無処理と投稿した資材の2区のときは組み合わせの表を出さず、区ごとに名前と説明を書くだけにする。
 */
export function ReportPagePlots({
  input,
  postedName,
  onChange,
  missing,
}: {
  input: UsageReportInput;
  /** 投稿する資材の名前。区の自動の名前と資材のチップに使う。 */
  postedName: string;
  onChange: (next: UsageReportInput) => void;
  missing: boolean;
}) {
  const [refused, setRefused] = useReducer(
    (_current: Refusal | null, next: Refusal | null) => next,
    null,
  );

  const change = (next: UsageReportInput) => {
    setRefused(null);
    onChange(next);
  };

  // 区を足す操作は、要る区が上限に収まらないと、渡した input をそのまま返す
  const add = (next: UsageReportInput, what: Refusal) => {
    if (next === input) {
      setRefused(what);

      return false;
    }

    change(next);

    return true;
  };

  const refusal = (what: Refusal) =>
    refused === what && (
      <p className={limitError} role="alert">
        {what}を足すと区が{REPORT_PLOT_LIMIT}
        を超えるため、足せません。区を減らしてから足してください。
      </p>
    );

  const plan = plotPlan(input, postedName);
  const layout = reportPlotLayout(input, postedName);
  const common = plan.showMatrix || input.commonPlotDescription.trim() !== "";
  const numbered = new Map(input.plots.map((plot, index) => [plot.id, index + 1]));

  const update = (id: string, patch: Partial<Pick<Plot, "name" | "description">>) =>
    change({
      ...input,
      plots: input.plots.map((plot) => (plot.id === id ? { ...plot, ...patch } : plot)),
    });

  const plotCard = (plot: Plot, series: ReportPlotSeries) => {
    const number = numbered.get(plot.id) ?? 0;

    const example = common
      ? EXAMPLES.difference
      : plot.treatment?.kind === "untreated"
        ? EXAMPLES.untreated
        : EXAMPLES.used;

    const described = plot.description.trim() !== "" || input.commonPlotDescription.trim() !== "";

    return (
      <div key={plot.id} className={plotStyle}>
        <div className={plotHead}>
          <span className={cx(dot, reportPlotColor({ series }))} aria-hidden="true" />区{number}
          {input.plots.length > 2 && (
            <button
              type="button"
              className={removeButton}
              aria-label={`区${number}を削除`}
              onClick={() => change(reportPlotEdits.removePlot(input, plot.id, postedName))}
            >
              <Icon name="close" />
            </button>
          )}
        </div>
        <div className={fields}>
          {plot.treatment === null && (
            <Select
              fieldClassName={css({ mb: "3" })}
              label={<span className={labelStyle}>使った資材</span>}
              placeholder="資材を選ぶ"
              options={plan.materials.map(({ key, name, role }) => ({
                value: key,
                label: role === name ? name : `${name}（${role}）`,
              }))}
              error={missing ? "区で使った資材を選んでください" : undefined}
              onValueChange={(key) => {
                const material = plan.materials.find((item) => item.key === key);

                if (material !== undefined)
                  change(
                    reportPlotEdits.setTreatment(input, plot.id, material.treatment, postedName),
                  );
              }}
            />
          )}
          <Input
            label={<span className={labelStyle}>区の名前</span>}
            placeholder="例）無処理区"
            maxLength={REPORT_SHORT_MAX}
            value={plot.name}
            error={missing && plot.name.trim() === "" ? "区の名前を記入してください" : undefined}
            onChange={(event) => update(plot.id, { name: event.target.value })}
          />
          <Textarea
            fieldClassName={css({ mt: "3" })}
            label="区の説明"
            placeholder={example}
            maxLength={REPORT_BODY_MAX}
            description={reportLengthNote(plot.description, REPORT_BODY_MAX)}
            value={plot.description}
            error={missing && !described ? "区の説明を記入してください" : undefined}
            onChange={(event) => update(plot.id, { description: event.target.value })}
          />
          <ReportPdfReadingMark fields={plotMarkFields(plot.id)} />
        </div>
      </div>
    );
  };

  return (
    <>
      <p className={docLead}>
        試した品種と使った資材を並べ、区ごとに名前と説明を書きます。
        <br />
        説明には、調査した範囲と、資材の使い方（施用方法・希釈倍率・使用量・回数など）を書いてください。
        <br />
        <span className={docLeadMark}>
          差し込む資料を見ればわかる場合は「資料を参照」と書いてもかまいません。
        </span>
      </p>

      <p className={fieldLabel}>品種</p>
      {input.varietyUnknown ? (
        <p className={note}>不明・なし（上の「品種」で変えられます）</p>
      ) : (
        <>
          <div className={chips}>
            {input.varieties.map((variety) => {
              const name = variety.name.trim() || "（品種名未入力）";

              return input.varieties.length > 1 ? (
                <Chip
                  key={variety.id}
                  onRemove={() =>
                    change(reportPlotEdits.removeVariety(input, variety.id, postedName))
                  }
                  removeLabel={`${name}を外す`}
                >
                  {name}
                </Chip>
              ) : (
                <Chip key={variety.id}>{name}</Chip>
              );
            })}
          </div>
          <Adder
            label="足す品種名"
            placeholder="品種名"
            action="品種を足す"
            disabled={input.varieties.length >= REPORT_PLOT_LIMIT}
            onAdd={(name) => add(reportPlotEdits.addVariety(input, name, postedName), "品種")}
          />
          {refusal("品種")}
        </>
      )}

      <p className={fieldLabel}>使った資材</p>
      <div className={chips}>
        {plan.materials.map(({ key, name, role, series, treatment }) => {
          const label = (
            <>
              <span className={cx(swatch, reportPlotColor({ series }))} />
              {name}
              {role !== name && <span className={chipRole}>（{role}）</span>}
            </>
          );

          return treatment.kind === "compared" ? (
            <Chip
              key={key}
              onRemove={() =>
                change(
                  reportPlotEdits.removeComparedMaterial(
                    input,
                    treatment.comparedMaterialId,
                    postedName,
                  ),
                )
              }
              removeLabel={`${name}を外す`}
            >
              {label}
            </Chip>
          ) : (
            <Chip key={key}>{label}</Chip>
          );
        })}
      </div>
      <ReportPdfReadingMark
        fields={input.comparedMaterials.map(({ id, name }) => ({
          key: `comparedMaterials.${id}.name`,
          label: name.trim() || "比較した資材",
        }))}
      />
      <Adder
        label="足す比較した資材の名前"
        placeholder="比較した資材の名前"
        action="比較した資材を足す"
        disabled={input.comparedMaterials.length >= REPORT_PLOT_LIMIT}
        onAdd={(name) =>
          add(reportPlotEdits.addComparedMaterial(input, name, postedName), "比較した資材")
        }
      />
      {refusal("比較した資材")}

      {plan.showMatrix && (
        <>
          <p className={fieldLabel}>試した組み合わせ</p>
          <p className={note}>チェックした組み合わせが区になります。</p>
          <div className={matrixWrap}>
            <table className={matrix}>
              <thead>
                <tr>
                  <td />
                  {plan.materials.map((material) => (
                    <th key={material.key} scope="col">
                      {material.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((variety) => {
                  const varietyName = variety === null ? "品種なし" : variety.name.trim() || "品種";

                  return (
                    <tr key={variety?.id ?? "none"}>
                      <th scope="row">{varietyName}</th>
                      {plan.materials.map((material) => {
                        const checked = plan.checked(variety?.id ?? null, material.treatment);

                        return (
                          <td key={material.key}>
                            <Checkbox
                              size="sm"
                              checked={checked}
                              disabled={!checked && plan.full}
                              onCheckedChange={(next) =>
                                add(
                                  reportPlotEdits.toggle(
                                    input,
                                    variety?.id ?? null,
                                    material.treatment,
                                    next,
                                    postedName,
                                  ),
                                  "区",
                                )
                              }
                            >
                              <span className={visuallyHidden}>
                                {varietyName}・{material.name}
                              </span>
                            </Checkbox>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {plan.full && <p className={note}>区は{REPORT_PLOT_LIMIT}までです。</p>}
        </>
      )}

      {common && (
        <Textarea
          fieldClassName={css({ mt: "4" })}
          label="全区に共通の説明"
          requirement="optional"
          placeholder={
            "全区で同じ条件。区ごとの説明には違いだけを書きます\n例）1区5株、4反復。かん水と施肥は全区同じ。"
          }
          maxLength={REPORT_BODY_MAX}
          description={reportLengthNote(input.commonPlotDescription, REPORT_BODY_MAX)}
          value={input.commonPlotDescription}
          onChange={(event) => change({ ...input, commonPlotDescription: event.target.value })}
        />
      )}
      {common && <ReportPdfReadingMark fields={[{ key: "commonPlotDescription" }]} />}

      {plan.showMatrix && <p className={fieldLabel}>区（{input.plots.length}）</p>}
      {layout.groups.map((group) => (
        <div key={group.key}>
          {group.variety !== null && (
            <p className={groupHeading}>品種：{group.variety || "（品種名未入力）"}</p>
          )}
          {group.plots.map(({ plot, series }) => plotCard(plot, series))}
        </div>
      ))}
      {!plan.full &&
        (plan.showMatrix ? (
          <PlotAdder
            plan={plan}
            onAdd={(varietyId, material) =>
              add(reportPlotEdits.addPlot(input, varietyId, material.treatment, postedName), "区")
            }
          />
        ) : (
          <button
            type="button"
            className={addButton}
            onClick={() =>
              add(
                reportPlotEdits.addPlot(
                  input,
                  plan.rows[0]?.id ?? null,
                  { kind: "posted" },
                  postedName,
                ),
                "区",
              )
            }
          >
            <Icon name="add" size="sm" />
            区を追加
          </button>
        ))}
      {refusal("区")}
    </>
  );
}
