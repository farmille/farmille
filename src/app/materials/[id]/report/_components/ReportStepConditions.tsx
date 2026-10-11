"use client";

import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";
import type { UsageReportFieldErrors, UsageReportInput } from "@/lib/usage-report";

import { Checkbox, Field, Fieldset, Input, Notice, Select, Textarea } from "@/components/form";
import { ToggleGroup } from "@/components/ToggleGroup";

import { css } from "../../../../../../styled-system/css";

import { GroupHeading } from "./ReportFormParts";

const DATE_PATTERN = /\d+\s*月\s*\d+\s*日|\d+\s*[/／]\s*\d+|\d+\s*日/;
const toHalfWidth = (text: string) =>
  text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

const TIMING_OPTIONS = APPLICATION_TIMINGS.map((label, index) => ({ value: String(index), label }));

const PREFECTURE_OPTIONS = PREFECTURES.map((prefecture) => ({
  value: String(prefecture.code),
  label: prefecture.name,
}));

const shortControl = css({ maxW: "64" });

const cityInput = css({ display: "block", maxW: "64", mt: "1.5" });

const timelineHint = css({
  mt: "0.5",
  fontSize: "xs",
  color: "text.subtle",
  tab: { display: "none" },
});

export function ReportStepConditions({
  input,
  onChange,
  errors,
  registeredCity,
}: {
  input: UsageReportInput;
  onChange: (input: UsageReportInput) => void;
  errors: UsageReportFieldErrors;
  registeredCity: string;
}) {
  const missingDate =
    input.timingNote.trim().length > 0 && !DATE_PATTERN.test(toHalfWidth(input.timingNote));
  return (
    <>
      <GroupHeading title="栽培条件" note="どこで・どんな環境で育てているか" />
      <Field
        label="地域"
        requirement="required"
        lead="アカウント登録時の住所が入っています。今回の圃場が別の場所なら変更してください。"
        error={errors.prefectureCode}
      >
        <Select
          className={shortControl}
          options={PREFECTURE_OPTIONS}
          placeholder="都道府県を選択"
          value={input.prefectureCode === null ? null : String(input.prefectureCode)}
          onValueChange={(value) =>
            onChange({ ...input, prefectureCode: value === null ? null : Number(value) })
          }
        />
      </Field>
      <Checkbox
        variant="row"
        className={css({ mt: "2" })}
        description="チェックなしの場合は都道府県まで表示します"
        checked={input.showCity}
        onCheckedChange={(showCity) =>
          onChange({
            ...input,
            showCity,
            city: showCity && input.city.trim() === "" ? registeredCity : input.city,
          })
        }
      >
        市区町村も表示する
      </Checkbox>
      {input.showCity && (
        <Input
          aria-label="市区町村"
          className={cityInput}
          placeholder="市区町村　例）〇〇市"
          value={input.city}
          onChange={(event) => onChange({ ...input, city: event.target.value })}
        />
      )}

      <Field
        label="栽培環境"
        requirement="required"
        lead="露地栽培か施設栽培か、養液の使用など、栽培環境を記入してください。"
        error={errors.cultivationEnvironment}
      >
        <Textarea
          placeholder="栽培環境"
          value={input.cultivationEnvironment}
          onChange={(event) => onChange({ ...input, cultivationEnvironment: event.target.value })}
        />
      </Field>
      <Notice tone="neutral" title="記入例" className={css({ mt: "2" })}>
        ・露地栽培。黒マルチを敷き、雨よけはしていません。
        <br />
        ・パイプハウスで土耕栽培。無加温で、灌水チューブで週2回かん水しています。
        <br />
        ・ガラス温室で養液栽培。暖房機で最低夜温12℃を保っています。
      </Notice>

      <Fieldset
        legend="施用時期"
        requirement="required"
        lead="資材を使ったときの段階をタップします（複数選択できます）。"
        error={errors.timingStages}
      >
        <ToggleGroup
          multiple
          aria-label="施用時期の段階"
          options={TIMING_OPTIONS}
          value={input.timingStages.map(String)}
          variant="timeline"
          onValueChange={(next) => onChange({ ...input, timingStages: next.map(Number) })}
        />
        <div className={timelineHint}>横にスクロールすると続きの段階が出ます</div>
      </Fieldset>
      <Field
        label="処理日・定植日・生育状況（必須）"
        hideLabel
        requirement="required"
        lead={
          <>
            <b>処理日（資材を使った日）は必ず記入してください。</b>
            あわせて、定植日やそのときの生育状況も記入します。
          </>
        }
        error={errors.timingNote}
        className={css({ mt: "3" })}
      >
        <Textarea
          placeholder="処理日・定植日・そのときの生育状況"
          value={input.timingNote}
          onChange={(event) => onChange({ ...input, timingNote: event.target.value })}
        />
      </Field>
      {/* 入力のたびに出し入れする注意なので、読み上げ領域は常に置いておく */}
      <div role="status">
        {missingDate && (
          <Notice tone="warn" className={css({ mt: "1.5" })}>
            処理日（〇月〇日）が見当たりません。資材を使った日を記入してください。
          </Notice>
        )}
      </div>
      <Notice tone="neutral" title="記入例" className={css({ mt: "2" })}>
        3月6日に定植。開花してすぐの6月5日に施用。7日おきに3回。
      </Notice>
    </>
  );
}
