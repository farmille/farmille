"use client";

import { useState } from "react";

import type { UsageReportFieldErrors, UsageReportInput } from "@/lib/usage-report";

import { inputRecipe } from "@/components/Input";
import { textareaRecipe } from "@/components/Textarea";

import { css, cx } from "../../../../../../styled-system/css";

import {
  Badge,
  Example,
  Need,
  chipRecipe,
  chips,
  field,
  fieldLabel,
  guide,
  pillButtonRecipe,
  subLabel,
} from "./ReportFormParts";

export type ReportEffectOption = { id: string; name: string; categoryName: string };

const RESULT_EXAMPLE = [
  "定植後から2週間おきに、灌水と合わせて3回使いました。1回目の使用後は見た目で分かる変化はありませんでしたが、2回目の使用から数日後、午後の葉の萎れが使用前よりやや軽くなったように感じました。上の方の葉が立っていて、夕方まで樹勢を保つ株が増えたように見えます。3回目の後も同じ傾向でしたが、すべての株に明確な差があったわけではありません。",
  "収量が増えるような劇的な変化は確認できませんでしたが、暑い時期の萎れや樹勢低下を抑える補助としては手応えがありました。通常の灌水に足すだけなので手間はほとんど増えていません。薬害（葉焼け・変色）や生育の悪化は見られませんでした。次回は定植直後から使い、収量や裂果数も比べながらもう一度試したいと思います。",
];

const resultArea = css(textareaRecipe.raw({}), { minH: "40" });

/** 「結果」のステップ */
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
  /** 対象資材に登録されている効果タグ。資材を変更した場合は空 */
  materialEffectNames: string[];
}) {
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
      <div>
        <label className={fieldLabel} htmlFor="report-result">
          結果・感想 <Badge required />
          <Need message={errors.observedChange} />
        </label>
        <div className={guide}>
          いつ頃から・どこに・どんな変化があったかと、全体の感想を記入してください。明確な変化が見られなかった場合も、そのまま記入してください。薬害や生育の悪化など良くなかった点があれば併記してください。
          <br />※ 収量や糖度などの数値は、ステップ4「比較・使用結果」で入力できます。
        </div>
        <textarea
          id="report-result"
          className={resultArea}
          placeholder="結果と感想"
          value={input.observedChange}
          onChange={(event) => onChange({ ...input, observedChange: event.target.value })}
        />
        <Example>
          {RESULT_EXAMPLE[0]}
          <br />
          {RESULT_EXAMPLE[1]}
        </Example>
      </div>
      <div className={field}>
        <div className={fieldLabel}>
          使用目的 <Badge required />
          <Need message={errors.purposeTags} />
        </div>
        <div className={guide}>この資材に期待した効果を選びます（複数選択できます）。</div>
        {materialEffectNames.length > 0 && (
          <>
            <div className={subLabel}>この資材に登録されている効果タグ</div>
            <div className={chips}>{materialEffectNames.map(chip)}</div>
          </>
        )}
        <button
          type="button"
          className={cx(pillButtonRecipe(), css({ mt: "2.5" }))}
          aria-expanded={allOpen}
          onClick={() => setAllOpen(!allOpen)}
        >
          {allOpen ? "－ 効果タグ一覧を閉じる" : "＋ 効果タグ一覧から選択"}
        </button>
        {allOpen && (
          <div className={css({ mt: "1.5" })}>
            {categories.map((category) => (
              <div key={category}>
                <div className={subLabel}>{category}</div>
                <div className={chips}>
                  {effects
                    .filter(
                      (effect) =>
                        effect.categoryName === category &&
                        !materialEffectNames.includes(effect.name),
                    )
                    .map((effect) => chip(effect.name))}
                </div>
              </div>
            ))}
          </div>
        )}
        <input
          className={cx(inputRecipe(), css({ mt: "2.5" }))}
          aria-label="使用目的の補足（任意）"
          placeholder="補足（任意）"
          maxLength={500}
          value={input.purposeNote}
          onChange={(event) => onChange({ ...input, purposeNote: event.target.value })}
        />
        <Example>
          ・灌水量を変えずに樹勢を維持したかった
          <br />
          ・高温期の萎れを軽くしたかった
        </Example>
      </div>
    </>
  );
}
