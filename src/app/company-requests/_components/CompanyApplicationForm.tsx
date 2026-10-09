"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as v from "valibot";

import { applicationCopy } from "@/lib/company-application-copy";
import {
  companyApplicationSchema,
  relationLabels,
  relationExplanation,
  evidenceExplanation,
  successionExplanation,
  historyExplanation,
  type SubmittableKind,
} from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { css } from "../../../../styled-system/css";
import { buttonRecipe } from "@/components/Button";
import { submitApplication } from "../actions";
import { ConsentFields } from "./ConsentFields";
import {
  ApplicationField,
  ContactFields,
  emptyContact,
  type ContactDefaults,
} from "./ContactFields";
import { EvidenceFields } from "./EvidenceFields";
import { textDangerButtonStyle } from "./EvidenceFields";
import {
  choiceInputStyle,
  choiceListStyle,
  choiceStyle,
  fieldHeadingStyle,
  fieldLabelStyle,
  fieldsetStyle,
  formBlockStyle,
  fieldStyle,
  formalActionsStyle,
  formalControlRecipe,
  formalDraftStyle,
  formalGuideRecipe,
  formalMessageRecipe,
  formalSubmitStyle,
  formNoteStyle,
  introStyle,
} from "./formal-styles";
import { ConditionMark, LabelNote, OptionalMark, RequiredMark } from "./FormalMarks";
import { FormSection } from "./FormSection";

const itemCardStyle = css({
  mt: "3",
  pt: "4.5",
  px: "5",
  pb: "5.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "formal.line",
  borderRadius: "mark",
});

const subHeadingStyle = css({
  mt: "6.5",
  mb: "-2",
  fontSize: "md",
  fontWeight: "extrabold",
  color: "formal.ink",
  letterSpacing: "0.02em",
});

const addItemStyle = css(buttonRecipe.raw({ variant: "ghost" }), {
  mt: "3",
  borderRadius: "mark",
  borderStyle: "dashed",
  borderColor: "accent.manufacturer",
  color: "accent.manufacturer",
  _disabled: { color: "text.subtle", borderColor: "border.default", cursor: "default" },
});

const orSeparatorStyle = css({
  my: "2.5",
  textAlign: "center",
  fontSize: "xs",
  color: "formal.subtle",
  letterSpacing: "0.1em",
});

type ItemRow = { id: string; target: "new" | "existing" };

function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className={fieldsetStyle}>
      <legend className={fieldLabelStyle}>
        {legend} <RequiredMark /> <LabelNote>単一選択</LabelNote>
      </legend>
      <div className={choiceListStyle}>
        {options.map((option) => (
          <label className={choiceStyle} key={option.value}>
            <input
              className={choiceInputStyle}
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              required
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function IntroCard({ text }: { text: string }) {
  const [lead, list = ""] = text.split("\n\n");
  const bullets = list
    .split(/(?:^|\s)・/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return (
    <div className={introStyle}>
      <p>{lead}</p>
      {bullets.length > 0 ? (
        <ul>
          {bullets.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const SECTION_TITLES = {
  registration: { company: "申請企業情報", items: "申請資材" },
  transfer_out: { company: "申請企業情報", items: "対象資材" },
  transfer_in: { company: "申請企業（移行先企業）情報", items: "対象資材" },
} as const satisfies Record<SubmittableKind, { company: string; items: string }>;

const SIGNER_LABELS = {
  registration: "担当者名",
  transfer_out: "担当者名（現資材オーナー企業）",
  transfer_in: "担当者名",
} as const satisfies Record<SubmittableKind, string>;

export function CompanyApplicationForm({
  intentId,
  kind,
  defaults,
  recipient,
}: {
  intentId: string;
  kind: SubmittableKind;
  defaults: ContactDefaults;
  recipient: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ItemRow[]>([
    { id: intentId, target: kind === "registration" ? "new" : "existing" },
  ]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [uploads, setUploads] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const copy = applicationCopy[kind];
  const titles = SECTION_TITLES[kind];
  const onBusy = (busy: boolean) => setUploads((count) => count + (busy ? 1 : -1));
  function countFiles(key: string, count: number) {
    setCounts((previous) => new Map(previous).set(key, count));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const text = (name: string) => v.parse(v.string(), data.get(name) ?? "");
    const contact = (prefix = "") => ({
      companyName: text(`${prefix}companyName`),
      corporateNumber: text(`${prefix}corporateNumber`),
      accountId: text(`${prefix}accountId`),
      contactName: text(`${prefix}contactName`),
      department: text(`${prefix}department`),
      email: text(`${prefix}email`),
      phone: text(`${prefix}phone`),
    });
    const items = rows.map((row) => ({
      id: row.id,
      target: row.target,
      materialName: text(`${row.id}.materialName`),
      materialUrl: row.target === "new" ? "" : text(`${row.id}.materialUrl`),
      officialUrl: text(`${row.id}.officialUrl`),
      evidenceUrl: text(`${row.id}.evidenceUrl`),
      relations: data.getAll(`${row.id}.relations`),
      ownerName: text(`${row.id}.ownerName`),
      ownerInformation: text(`${row.id}.ownerInformation`),
    }));
    const input = v.safeParse(companyApplicationSchema, {
      ...contact(),
      kind,
      items,
      destination: contact("destination."),
      background: text("background"),
      signerName: text("signerName"),
      applicationDate: text("applicationDate"),
      consents: copy.consents.map((_, index) => data.get(`consent.${index}`) === "on"),
    });
    if (!input.success) {
      setError(`入力内容を確認してください。${v.summarize(input.issues)}`);
      setSubmitting(false);
      return;
    }
    try {
      const result = await submitApplication({ intentId, input: input.output });
      if (!result.ok) {
        setError(`${errorMessageJa[result.error]} 資材URL・移行先ID・必須資料もご確認ください。`);
        return;
      }
      router.push(`/dashboard/applications/${result.data}`);
    } catch {
      setError(
        "申請結果を確認できませんでした。入力内容はこの画面に残っています。同じ内容で再送しても、申請は重複しません。",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <IntroCard text={copy.introduction} />
      <p className={formNoteStyle}>
        担当者情報・ご提出資料は公開されません。申請の保存後に運営が内容を確認します。
      </p>

      <fieldset disabled={submitting} className={formBlockStyle}>
        <FormSection title={titles.company}>
          <ContactFields defaults={defaults} fixedAccount />
        </FormSection>
      </fieldset>

      <FormSection title={titles.items}>
        <div className={formalGuideRecipe()}>
          複数ある場合は「資材を追加」で資材ごとに繰り返し入力してください。資材名はパッケージ記載の正式名称を入力してください。
        </div>
        <div>
          {rows.map((row, index) => (
            <MaterialItem
              index={index}
              intentId={intentId}
              key={row.id}
              kind={kind}
              onBusy={onBusy}
              onCount={countFiles}
              onRemove={() => setRows((previous) => previous.filter((item) => item.id !== row.id))}
              onTarget={(target) =>
                setRows((previous) =>
                  previous.map((item) => (item.id === row.id ? { ...item, target } : item)),
                )
              }
              removable={rows.length > 1}
              removeDisabled={
                uploads > 0 ||
                (counts.get(`${row.id}.package`) ?? 0) > 0 ||
                (counts.get(`${row.id}.involvement`) ?? 0) > 0
              }
              row={row}
            />
          ))}
        </div>
        <button
          className={addItemStyle}
          disabled={rows.length >= 100 || submitting}
          onClick={() =>
            setRows((previous) => [
              ...previous,
              { id: crypto.randomUUID(), target: kind === "registration" ? "new" : "existing" },
            ])
          }
          type="button"
        >
          ＋ 資材を追加
        </button>
      </FormSection>

      {kind === "transfer_out" ? (
        <FormSection title="移行先企業情報">
          <ContactFields prefix="destination." defaults={emptyContact} />
        </FormSection>
      ) : null}
      {kind === "transfer_in" ? (
        <>
          <FormSection title="移行の経緯">
            <ApplicationField id="background" label="申請の経緯" badges={<RequiredMark />}>
              <textarea
                className={formalControlRecipe({ multiline: true })}
                id="background"
                maxLength={10000}
                name="background"
                placeholder="例：事業譲渡により当該資材に関する事業を承継した"
                required
              />
            </ApplicationField>
          </FormSection>
          <FormSection title="経緯を確認できる資料">
            <div className={formalGuideRecipe()}>{historyExplanation}</div>
            <div className={fieldStyle}>
              <div className={fieldHeadingStyle}>
                現オーナー企業の同意が確認できる資料（メール等の写し） <OptionalMark />
              </div>
              <EvidenceFields
                inputId="evidence-owner-agreement"
                intentId={intentId}
                itemKey={null}
                label="現オーナー企業の同意が確認できる資料（任意、メール等の写し）"
                onBusy={onBusy}
                purpose="owner_agreement"
              />
            </div>
            <div className={fieldStyle}>
              <div className={fieldHeadingStyle}>
                移行の事実が確認できる資料（官報公告・プレスリリース・契約書等） <OptionalMark />
              </div>
              <EvidenceFields
                inputId="evidence-succession"
                intentId={intentId}
                itemKey={null}
                label="移行の事実が確認できる資料（任意、官報公告・プレスリリース・契約書等）"
                onBusy={onBusy}
                purpose="succession"
              />
            </div>
          </FormSection>
        </>
      ) : null}

      <ConsentFields kind={kind} />

      <FormSection title="署名">
        <ApplicationField id="applicationDate" label="申請日" badges={<RequiredMark />}>
          <input
            className={formalControlRecipe()}
            defaultValue={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })}
            id="applicationDate"
            name="applicationDate"
            required
            type="date"
          />
        </ApplicationField>
        <ApplicationField id="signerName" label={SIGNER_LABELS[kind]} badges={<RequiredMark />}>
          <input
            className={formalControlRecipe()}
            id="signerName"
            maxLength={200}
            name="signerName"
            placeholder="記入例）金子 太郎"
            required
          />
        </ApplicationField>
      </FormSection>

      <p className={formNoteStyle}>
        受付番号と回答の控えを企業会員の登録連絡先「{recipient}
        」へ送信します。審査後の連絡先は、入力した担当者メールアドレスです。
      </p>
      {error ? (
        <div className={formalMessageRecipe({ tone: "error" })} role="alert">
          {error}
        </div>
      ) : null}
      <div className={formalActionsStyle}>
        <button className={formalSubmitStyle} disabled={submitting || uploads > 0} type="submit">
          {submitting ? "申請を保存しています…" : "内容を確認して申請する"}
        </button>
        <div className={formalDraftStyle}>
          完了時、または資料に不足がある場合にメールでご連絡します
        </div>
      </div>
    </form>
  );
}

function MaterialItem({
  row,
  index,
  kind,
  intentId,
  removable,
  removeDisabled,
  onRemove,
  onTarget,
  onBusy,
  onCount,
}: {
  row: ItemRow;
  index: number;
  kind: SubmittableKind;
  intentId: string;
  removable: boolean;
  removeDisabled: boolean;
  onRemove: () => void;
  onTarget: (target: ItemRow["target"]) => void;
  onBusy: (busy: boolean) => void;
  onCount: (key: string, count: number) => void;
}) {
  const field = (name: string) => `${row.id}.${name}`;
  const fieldId = (name: string) => `item-${row.id}-${name}`;
  const evidenceGuideId = fieldId("evidence-guide");
  const materialName = (
    <ApplicationField
      id={fieldId("materialName")}
      label="資材名"
      badges={<RequiredMark />}
      guide="※パッケージ記載の正式名称"
    >
      <input
        aria-describedby={`${fieldId("materialName")}-guide`}
        className={formalControlRecipe()}
        id={fieldId("materialName")}
        maxLength={300}
        name={field("materialName")}
        placeholder="パッケージ記載の正式名称"
        required
      />
    </ApplicationField>
  );
  const materialUrl =
    row.target === "existing" ? (
      <ApplicationField
        id={fieldId("materialUrl")}
        label="FarmilleページURL"
        badges={
          kind === "registration" ? (
            <ConditionMark>掲載済み資材の場合は必須</ConditionMark>
          ) : (
            <RequiredMark />
          )
        }
      >
        <input
          className={formalControlRecipe()}
          id={fieldId("materialUrl")}
          maxLength={2000}
          name={field("materialUrl")}
          placeholder="https://www.farmille.com/materials/…"
          required
          type="url"
        />
      </ApplicationField>
    ) : null;
  const relations =
    kind === "registration" ? (
      <fieldset className={fieldsetStyle}>
        <legend className={fieldLabelStyle}>
          当該資材との関係 <RequiredMark /> <LabelNote>複数選択可</LabelNote>
        </legend>
        <div className={choiceListStyle}>
          {Object.entries(relationLabels).map(([value, label]) => (
            <label className={choiceStyle} key={value}>
              <input
                className={choiceInputStyle}
                name={field("relations")}
                type="checkbox"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>
        <div className={formalGuideRecipe({ placement: "trailing" })}>{relationExplanation}</div>
      </fieldset>
    ) : null;
  const evidence = (
    <div className={fieldStyle}>
      <div className={fieldHeadingStyle}>
        {kind === "transfer_out"
          ? "移行先企業の関与を確認できる資料"
          : kind === "transfer_in"
            ? "貴社の企業名が当該資材のパッケージ上に明記されていることが確認できる資料"
            : "パッケージが確認できる資料"}{" "}
        <RequiredMark />
      </div>
      <div className={formalGuideRecipe()} id={evidenceGuideId}>
        {kind === "transfer_out"
          ? "移行先企業名がパッケージ上に明記されていることが確認できる画像・PDF、またはパッケージが確認できる製品ページURLをご提出ください。"
          : evidenceExplanation}
        資料の添付、または資料URLのいずれかが必須です。
      </div>
      <EvidenceFields
        describedBy={evidenceGuideId}
        inputId={fieldId("package")}
        intentId={intentId}
        itemKey={row.id}
        label="パッケージ・ラベルの資料"
        onBusy={onBusy}
        onCount={(count) => onCount(`${row.id}.package`, count)}
        purpose="package"
      />
      <div className={orSeparatorStyle}>または</div>
      <input
        aria-label="パッケージが確認できる製品ページURL"
        className={formalControlRecipe()}
        maxLength={2000}
        name={field("evidenceUrl")}
        placeholder="パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL（https://）"
        type="url"
      />
    </div>
  );

  return (
    <div className={itemCardStyle}>
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2.5",
        })}
      >
        <b className={css({ fontSize: "lg", color: "formal.ink" })}>資材 {index + 1}</b>
        {removable ? (
          <button
            className={textDangerButtonStyle}
            disabled={removeDisabled}
            onClick={onRemove}
            type="button"
          >
            この資材を削除
          </button>
        ) : null}
      </div>
      {removable ? (
        <div
          className={css({ mt: "1", color: "accent.danger", fontSize: "sm", lineHeight: "prose" })}
        >
          添付がある場合は、資料を削除してから資材を削除してください。
        </div>
      ) : null}

      {kind === "registration" ? (
        <>
          <div className={subHeadingStyle}>2-1. 申請内容</div>
          <RadioGroup
            legend="申請内容"
            name={field("target")}
            onChange={(value) => onTarget(v.parse(v.picklist(["new", "existing"]), value))}
            options={[
              { value: "new", label: "資材情報の新規掲載" },
              { value: "existing", label: "掲載済み資材の資材オーナー権限" },
            ]}
            value={row.target}
          />
          <div className={subHeadingStyle}>2-2. 対象資材</div>
          {materialName}
          {materialUrl}
          <ApplicationField
            id={fieldId("officialUrl")}
            label="製品公式ページURL"
            badges={<OptionalMark />}
          >
            <input
              className={formalControlRecipe()}
              id={fieldId("officialUrl")}
              maxLength={2000}
              name={field("officialUrl")}
              placeholder="https://"
              type="url"
            />
          </ApplicationField>
          <div className={subHeadingStyle}>2-3. 当該資材との関係</div>
          {relations}
          <div className={subHeadingStyle}>2-4. パッケージが確認できる資料</div>
          {evidence}
        </>
      ) : null}

      {kind === "transfer_out" || kind === "transfer_in" ? (
        <>
          <div className={subHeadingStyle}>2-1. 対象資材</div>
          {materialUrl}
          {materialName}
          {kind === "transfer_in" ? (
            <>
              <div className={subHeadingStyle}>2-2. 当該資材の現在の資材オーナー企業</div>
              <ApplicationField id={fieldId("ownerName")} label="法人名" badges={<RequiredMark />}>
                <input
                  className={formalControlRecipe()}
                  id={fieldId("ownerName")}
                  maxLength={200}
                  name={field("ownerName")}
                  required
                />
              </ApplicationField>
              <ApplicationField
                id={fieldId("ownerInformation")}
                label="その他、分かる情報"
                badges={<OptionalMark />}
              >
                <textarea
                  className={formalControlRecipe({ multiline: true })}
                  id={fieldId("ownerInformation")}
                  maxLength={10000}
                  name={field("ownerInformation")}
                  placeholder="担当部署・担当者名・連絡先など、分かる範囲で"
                />
              </ApplicationField>
            </>
          ) : null}
          <div className={subHeadingStyle}>
            {kind === "transfer_in"
              ? "2-3. 申請企業の関与を確認できる資料"
              : "2-2. 移行先企業の関与を確認できる資料"}
          </div>
          {evidence}
          <div className={fieldStyle}>
            <div className={fieldHeadingStyle}>
              または、その他、当該資材と貴社との関係を確認できる資料
            </div>
            <div className={formalGuideRecipe()}>{successionExplanation}</div>
            <EvidenceFields
              inputId={fieldId("involvement")}
              intentId={intentId}
              itemKey={row.id}
              label="その他、資材との関係を確認できる資料"
              onBusy={onBusy}
              onCount={(count) => onCount(`${row.id}.involvement`, count)}
              purpose="involvement"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
