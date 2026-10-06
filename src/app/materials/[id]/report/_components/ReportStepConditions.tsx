"use client";

import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import type { UsageReportFieldErrors, UsageReportInput } from "@/lib/usage-report";

import { Badge, Example, Need } from "./ReportFormParts";

const DATE_PATTERN = /\d+\s*月\s*\d+\s*日|\d+\s*[/／]\s*\d+|\d+\s*日/;
const toHalfWidth = (text: string) =>
  text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

/** 見本の pane 3「栽培条件」 */
export function ReportStepConditions({
  input,
  onChange,
  errors,
}: {
  input: UsageReportInput;
  onChange: (input: UsageReportInput) => void;
  errors: UsageReportFieldErrors;
}) {
  const missingDate =
    input.timingNote.trim().length > 0 && !DATE_PATTERN.test(toHalfWidth(input.timingNote));
  return (
    <>
      <h3 className="grp" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
        栽培条件<small>どこで・どんな環境で育てているか</small>
      </h3>
      <div className="field">
        <label htmlFor="report-prefecture">
          地域 <Badge required />
          <Need message={errors.prefectureCode} />
        </label>
        <div className="guide">
          アカウント登録時の住所が入っています。今回の圃場が別の場所なら変更してください。
        </div>
        <select
          id="report-prefecture"
          className="input"
          style={{ maxWidth: 260 }}
          value={input.prefectureCode ?? ""}
          onChange={(event) =>
            onChange({
              ...input,
              prefectureCode: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <option value="">都道府県を選択</option>
          {PREFECTURES.map((prefecture) => (
            <option key={prefecture.code} value={prefecture.code}>
              {prefecture.name}
            </option>
          ))}
        </select>
        <input
          id="report-city"
          aria-label="市区町村"
          className="input"
          style={{ maxWidth: 260, marginTop: 6, display: "block" }}
          placeholder="市区町村　例）〇〇市"
          value={input.city}
          onChange={(event) => onChange({ ...input, city: event.target.value })}
        />
        <label className="check" style={{ marginTop: 8 }}>
          <input
            type="checkbox"
            checked={input.showCity}
            onChange={(event) => onChange({ ...input, showCity: event.target.checked })}
          />{" "}
          市区町村も表示する
          <span className="muted">チェックなしの場合は都道府県まで表示します</span>
        </label>
      </div>

      <div className="field">
        <label htmlFor="report-environment">
          栽培環境 <Badge required />
          <Need message={errors.cultivationEnvironment} />
        </label>
        <div className="guide">
          露地栽培か施設栽培か、養液の使用など、栽培環境を記入してください。
        </div>
        <textarea
          id="report-environment"
          className="textarea"
          style={{ minHeight: 70 }}
          placeholder="栽培環境"
          value={input.cultivationEnvironment}
          onChange={(event) => onChange({ ...input, cultivationEnvironment: event.target.value })}
        />
        <Example>
          ・露地栽培。黒マルチを敷き、雨よけはしていません。
          <br />
          ・パイプハウスで土耕栽培。無加温で、灌水チューブで週2回かん水しています。
          <br />
          ・ガラス温室で養液栽培。暖房機で最低夜温12℃を保っています。
        </Example>
      </div>

      <div className="field">
        <label>
          施用時期 <Badge required />
          <Need message={errors.timingStages ?? errors.timingNote} />
        </label>
        <div className="guide">資材を使ったときの段階をタップします（複数選択できます）。</div>
        <div className="tl-wrap">
          <div className="tl" role="group" aria-label="施用時期の段階">
            {APPLICATION_TIMINGS.map((timing, index) => {
              const on = input.timingStages.includes(index);
              return (
                <button
                  key={timing}
                  type="button"
                  className={on ? "tl-i on" : "tl-i"}
                  aria-pressed={on}
                  onClick={() =>
                    onChange({
                      ...input,
                      timingStages: on
                        ? input.timingStages.filter((stage) => stage !== index)
                        : [...input.timingStages, index].toSorted((a, b) => a - b),
                    })
                  }
                >
                  {timing}
                </button>
              );
            })}
          </div>
        </div>
        <div className="tl-hint">横にスクロールすると続きの段階が出ます</div>
        <div className="guide" style={{ marginTop: 12 }}>
          <b>処理日（資材を使った日）は必ず記入してください。</b>
          あわせて、定植日やそのときの生育状況も記入します。
        </div>
        <textarea
          className="textarea"
          style={{ minHeight: 70 }}
          aria-label="処理日・定植日・生育状況（必須）"
          placeholder="処理日・定植日・そのときの生育状況"
          value={input.timingNote}
          onChange={(event) => onChange({ ...input, timingNote: event.target.value })}
        />
        {missingDate && (
          <div className="warn" role="status">
            処理日（〇月〇日）が見当たりません。資材を使った日を記入してください。
          </div>
        )}
        <Example>3月6日に定植。開花してすぐの6月5日に施用。7日おきに3回。</Example>
      </div>
    </>
  );
}
