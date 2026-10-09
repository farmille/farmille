"use client";

import { useState } from "react";

import type { UsageReportFieldErrors, UsageReportInput } from "@/lib/usage-report";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import { Field, Fieldset, Input, Notice, Textarea } from "@/components/form";

import { css } from "../../../../../../styled-system/css";

import { chipRecipe, chips } from "./ReportFormParts";

export type ReportEffectOption = { id: string; name: string; categoryName: string };

const RESULT_EXAMPLE = [
  "定植後から2週間おきに、灌水と合わせて3回使いました。1回目の使用後は見た目で分かる変化はありませんでしたが、2回目の使用から数日後、午後の葉の萎れが使用前よりやや軽くなったように感じました。上の方の葉が立っていて、夕方まで樹勢を保つ株が増えたように見えます。3回目の後も同じ傾向でしたが、すべての株に明確な差があったわけではありません。",
  "収量が増えるような劇的な変化は確認できませんでしたが、暑い時期の萎れや樹勢低下を抑える補助としては手応えがありました。通常の灌水に足すだけなので手間はほとんど増えていません。薬害（葉焼け・変色）や生育の悪化は見られませんでした。次回は定植直後から使い、収量や裂果数も比べながらもう一度試したいと思います。",
];

export function ReportStepResult({
  input,
  onChange,
  errors,
  effects,
  materialEffectNames,
}: {
  input: UsageReportInput;
  onChange: (input: UsageReportInput) => void;
  errors: UsageReportFieldErrors;
  effects: ReportEffectOption[];
  materialEffectNames: string[];
}) {
  // エラーの有無で Fieldset の中身が作り直されても、開いた一覧が閉じないよう開閉はここで持つ
  const [allOpen, setAllOpen] = useState(materialEffectNames.length === 0);
  const categories = [...new Set(effects.map((effect) => effect.categoryName))];
  function chip(name: string) {
    const on = input.purposeTags.includes(name);
    return (
      <button
        key={name}
        type="button"
        className={chipRecipe({ state: on ? "on" : "idle" })}
        aria-pressed={on}
        onClick={() =>
          onChange({
            ...input,
            purposeTags: on
              ? input.purposeTags.filter((tag) => tag !== name)
              : [...input.purposeTags, name],
          })
        }
      >
        {name}
      </button>
    );
  }
  return (
    <>
      <Field
        label="結果・感想"
        requirement="required"
        lead={
          <>
            いつ頃から・どこに・どんな変化があったかと、全体の感想を記入してください。明確な変化が見られなかった場合も、そのまま記入してください。薬害や生育の悪化など良くなかった点があれば併記してください。
            <br />※ 収量や糖度などの数値は、ステップ4「比較・使用結果」で入力できます。
          </>
        }
        error={errors.observedChange}
      >
        <Textarea
          size="lg"
          placeholder="結果と感想"
          value={input.observedChange}
          onChange={(event) => onChange({ ...input, observedChange: event.target.value })}
        />
      </Field>
      <Notice tone="neutral" title="記入例" className={css({ mt: "2" })}>
        {RESULT_EXAMPLE[0]}
        <br />
        {RESULT_EXAMPLE[1]}
      </Notice>
      <Fieldset
        legend="使用目的"
        requirement="required"
        lead="この資材に期待した効果を選びます（複数選択できます）。"
        error={errors.purposeTags}
      >
        {materialEffectNames.length > 0 && (
          <Fieldset legend="この資材に登録されている効果タグ" labelSize="sm">
            <div className={chips}>{materialEffectNames.map(chip)}</div>
          </Fieldset>
        )}
        <Collapsible open={allOpen} onOpenChange={setAllOpen} className={css({ mt: "2.5" })}>
          <CollapsibleTrigger variant="link">効果タグ一覧から選択</CollapsibleTrigger>
          <CollapsiblePanel>
            <div className={css({ pt: "1.5" })}>
              {categories.map((category) => (
                <Fieldset key={category} legend={category} labelSize="sm">
                  <div className={chips}>
                    {effects
                      .filter(
                        (effect) =>
                          effect.categoryName === category &&
                          !materialEffectNames.includes(effect.name),
                      )
                      .map((effect) => chip(effect.name))}
                  </div>
                </Fieldset>
              ))}
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </Fieldset>
      <Field label="使用目的の補足（任意）" hideLabel className={css({ mt: "2.5" })}>
        <Input
          placeholder="補足（任意）"
          maxLength={500}
          value={input.purposeNote}
          onChange={(event) => onChange({ ...input, purposeNote: event.target.value })}
        />
      </Field>
      <Notice tone="neutral" title="記入例" className={css({ mt: "2" })}>
        ・灌水量を変えずに樹勢を維持したかった
        <br />
        ・高温期の萎れを軽くしたかった
      </Notice>
    </>
  );
}
