"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as v from "valibot";

import { OptionalBadge, RequiredBadge } from "@/app/_mock/FormParts";
import { applicationCopy } from "@/lib/company-application-copy";
import {
  companyApplicationSchema,
  relationLabels,
  relationExplanation,
  evidenceExplanation,
  successionExplanation,
  historyExplanation,
  type ApplicationKind,
} from "@/lib/company-application";
import { errorMessageJa } from "@/server/errors";

import { submitApplication, restartRemoval } from "../actions";
import { ConsentFields, consentSectionCount } from "./ConsentFields";
import {
  ApplicationField,
  ContactFields,
  emptyContact,
  type ContactDefaults,
} from "./ContactFields";
import { EvidenceFields } from "./EvidenceFields";
import { FormSection } from "./FormSection";

type ItemRow = { id: string; target: "new" | "existing" };

/** 見本の f.tag（「単一選択」「複数選択可」など）。 */
function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>
      {children}
    </span>
  );
}

/** 見本の f.cond（「掲載済み資材の場合は必須」）。 */
function ConditionBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="badge badge-opt"
      style={{
        color: "var(--amber)",
        borderColor: "color-mix(in srgb, var(--amber) 35%, var(--line))",
      }}
    >
      {children}
    </span>
  );
}

/** 見本の single（`.radios` の `.radio`）。本物のラジオを中に置く。 */
function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: ReadonlyArray<{ value: string; label: string; sub?: string }>;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <fieldset className="field single">
      <legend className="field-label">
        {legend} <RequiredBadge /> <Tag>単一選択</Tag>
      </legend>
      <div className="radios">
        {options.map((option) => (
          <label className="radio" key={option.value}>
            <input
              checked={value === undefined ? undefined : value === option.value}
              name={name}
              onChange={onChange === undefined ? undefined : () => onChange(option.value)}
              required
              type="radio"
              value={option.value}
            />
            <span className="ring" aria-hidden="true"></span>
            <div>
              <div>{option.label}</div>
              {option.sub === undefined ? null : (
                <div className="muted" style={{ fontSize: 11.5, fontWeight: 400, marginTop: 2 }}>
                  {option.sub}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** 本番の申請紹介文（「\n\n」の後ろが「・」区切りの箇条）を、見本の intro-card の p と ul に分ける。 */
function IntroCard({ text }: { text: string }) {
  const [lead, list = ""] = text.split("\n\n");
  const bullets = list
    // 箇条の区切りは行頭か空白の直後の「・」だけ（「製造元・販売元」などの中黒では割らない）。
    .split(/(?:^|\s)・/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return (
    <div className="card intro-card" style={{ marginTop: 12 }}>
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
  removal: { company: "申請者情報", items: "申請資材" },
} as const satisfies Record<ApplicationKind, { company: string; items: string }>;

const SIGNER_LABELS = {
  registration: "担当者名",
  transfer_out: "担当者名（現資材オーナー企業）",
  transfer_in: "担当者名",
  removal: "申請者氏名",
} as const satisfies Record<ApplicationKind, string>;

/**
 * 見本 formScreen（申請フォーム A〜D、`.fm-chic`）。項目・必須・送信の手順・受付票への遷移は本番のまま。
 * 公開の終売・非表示（D）で使う。A〜C はメーカーダッシュボード側の申請フォームが受け持つ。
 */
export function CompanyApplicationForm({
  intentId,
  kind,
  defaults,
  recipient,
}: {
  intentId: string;
  kind: ApplicationKind;
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
      requestType: text(`${row.id}.requestType`),
      reason: text(`${row.id}.reason`),
      discloseReason: text(`${row.id}.discloseReason`) === "yes",
    }));
    const input = v.safeParse(companyApplicationSchema, {
      ...contact(),
      kind,
      items,
      destination: contact("destination."),
      background: text("background"),
      companyUrl: text("companyUrl"),
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
      router.push(
        kind === "removal"
          ? `/company-requests/receipts/${result.data}`
          : `/dashboard/applications/${result.data}`,
      );
    } catch {
      setError(
        "申請結果を確認できませんでした。入力内容はこの画面に残っています。同じ内容で再送しても、申請は重複しません。",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function restart() {
    if (
      !window.confirm(
        "入力内容と添付を破棄し、最初から入力しますか？ 受付済みの申請は変更されません。",
      )
    )
      return;
    setSubmitting(true);
    try {
      const result = await restartRemoval(intentId);
      if (!result.ok) {
        setError(errorMessageJa[result.error]);
        return;
      }
      window.location.reload();
    } catch {
      setError("入力を再開できませんでした。時間をおいてもう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  const extraSections = kind === "transfer_out" ? 1 : kind === "transfer_in" ? 2 : 0;
  const consentStart = 3 + extraSections;
  const signNumber = consentStart + consentSectionCount(kind);

  return (
    <form onSubmit={submit}>
      <IntroCard text={copy.introduction} />
      {kind === "removal" ? (
        <div style={{ marginTop: 12 }}>
          <p className="form-note">
            途中でページを閉じた場合、入力内容は復元されません。残った添付を破棄するには、最初から入力してください。
          </p>
          <button
            className="btn btn-ghost btn-sm"
            disabled={submitting || uploads > 0}
            onClick={() => void restart()}
            style={{ marginTop: 8 }}
            type="button"
          >
            入力と添付を破棄して最初から入力
          </button>
        </div>
      ) : null}
      <p className="form-note">
        担当者情報・ご提出資料は公開されません。申請の保存後に運営が内容を確認します。
      </p>

      <fieldset disabled={submitting} className="form-block">
        <FormSection number={1} title={titles.company}>
          <ContactFields
            defaults={defaults}
            removal={kind === "removal"}
            fixedAccount={kind !== "removal"}
          />
          {kind === "removal" ? (
            <ApplicationField
              id="companyUrl"
              label="会社概要ページのURL"
              badges={<RequiredBadge />}
            >
              <input
                className="input"
                id="companyUrl"
                maxLength={2000}
                name="companyUrl"
                placeholder="https://"
                required
                type="url"
              />
            </ApplicationField>
          ) : null}
        </FormSection>
      </fieldset>

      <FormSection number={2} title={titles.items}>
        <div className="fguide">
          複数ある場合は「資材を追加」で資材ごとに繰り返し入力してください。資材名はパッケージ記載の正式名称を入力してください。
        </div>
        <div className="items">
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
          className="btn btn-ghost add-item"
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
        <FormSection number={3} title="移行先企業情報">
          <ContactFields prefix="destination." defaults={emptyContact} />
        </FormSection>
      ) : null}
      {kind === "transfer_in" ? (
        <>
          <FormSection number={3} title="移行の経緯">
            <ApplicationField id="background" label="申請の経緯" badges={<RequiredBadge />}>
              <textarea
                className="textarea"
                id="background"
                maxLength={10000}
                name="background"
                placeholder="例：事業譲渡により当該資材に関する事業を承継した"
                required
              />
            </ApplicationField>
          </FormSection>
          <FormSection number={4} title="経緯を確認できる資料">
            <div className="fguide">{historyExplanation}</div>
            <div className="field">
              <div className="field-label">
                現オーナー企業の同意が確認できる資料（メール等の写し） <OptionalBadge />
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
            <div className="field">
              <div className="field-label">
                移行の事実が確認できる資料（官報公告・プレスリリース・契約書等） <OptionalBadge />
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

      <ConsentFields kind={kind} startNumber={consentStart} />

      <FormSection number={signNumber} title="署名">
        <ApplicationField id="applicationDate" label="申請日" badges={<RequiredBadge />}>
          <input
            className="input"
            defaultValue={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })}
            id="applicationDate"
            name="applicationDate"
            required
            type="date"
          />
        </ApplicationField>
        <ApplicationField id="signerName" label={SIGNER_LABELS[kind]} badges={<RequiredBadge />}>
          <input
            className="input"
            id="signerName"
            maxLength={200}
            name="signerName"
            placeholder="記入例）金子 太郎"
            required
          />
        </ApplicationField>
      </FormSection>

      <p className="form-note">
        受付番号と回答の控えを
        {kind === "removal" ? "確認済みメール" : "企業会員の登録連絡先"}「{recipient}
        」へ送信します。審査後の連絡先は、入力した担当者メールアドレスです。
      </p>
      {error ? (
        <div className="err-box show" role="alert">
          {error}
        </div>
      ) : null}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={submitting || uploads > 0} type="submit">
          {submitting ? "申請を保存しています…" : "内容を確認して申請する"}
        </button>
        <div className="draft">完了時、または資料に不足がある場合にメールでご連絡します</div>
      </div>
    </form>
  );
}

/** 見本 itemTpl()：資材ごとの `.card.item-card`。 */
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
  kind: ApplicationKind;
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
      badges={<RequiredBadge />}
      guide="※パッケージ記載の正式名称"
    >
      <input
        aria-describedby={`${fieldId("materialName")}-guide`}
        className="input"
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
            <ConditionBadge>掲載済み資材の場合は必須</ConditionBadge>
          ) : (
            <RequiredBadge />
          )
        }
      >
        <input
          className="input"
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
    kind === "registration" || kind === "removal" ? (
      <fieldset className="field multi">
        <legend className="field-label">
          当該資材との関係 <RequiredBadge /> <Tag>複数選択可</Tag>
        </legend>
        <div className="rel-chips">
          {Object.entries(relationLabels).map(([value, label]) => (
            <label className="org-opt" key={value}>
              <input name={field("relations")} type="checkbox" value={value} />
              {label}
            </label>
          ))}
        </div>
        <div className="fguide" style={{ marginTop: 6, marginBottom: 0 }}>
          {relationExplanation}
        </div>
      </fieldset>
    ) : null;
  const evidence = (
    <div className="field evidence">
      <div className="field-label">
        {kind === "transfer_out"
          ? "移行先企業の関与を確認できる資料"
          : kind === "transfer_in"
            ? "貴社の企業名が当該資材のパッケージ上に明記されていることが確認できる資料"
            : "パッケージが確認できる資料"}{" "}
        <RequiredBadge />
      </div>
      <div className="fguide" id={evidenceGuideId}>
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
      <div className="or-sep">または</div>
      <input
        aria-label="パッケージが確認できる製品ページURL"
        className="input"
        maxLength={2000}
        name={field("evidenceUrl")}
        placeholder="パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL（https://）"
        type="url"
      />
    </div>
  );

  return (
    <div className="card item-card">
      <div className="ih">
        <b>
          資材 <span className="idx">{index + 1}</span>
        </b>
        {removable ? (
          <button className="rm" disabled={removeDisabled} onClick={onRemove} type="button">
            この資材を削除
          </button>
        ) : null}
      </div>
      {removable ? (
        <div className="fguide" style={{ marginTop: 4 }}>
          添付がある場合は、資料を削除してから資材を削除してください。
        </div>
      ) : null}

      {kind === "registration" ? (
        <>
          <div className="sub-h">2-1. 申請内容</div>
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
          <div className="sub-h">2-2. 対象資材</div>
          {materialName}
          {materialUrl}
          <ApplicationField
            id={fieldId("officialUrl")}
            label="製品公式ページURL"
            badges={<OptionalBadge />}
          >
            <input
              className="input"
              id={fieldId("officialUrl")}
              maxLength={2000}
              name={field("officialUrl")}
              placeholder="https://"
              type="url"
            />
          </ApplicationField>
          <div className="sub-h">2-3. 当該資材との関係</div>
          {relations}
          <div className="sub-h">2-4. パッケージが確認できる資料</div>
          {evidence}
        </>
      ) : null}

      {kind === "removal" ? (
        <>
          <div className="sub-h">2-1. 対象資材</div>
          {materialUrl}
          {materialName}
          <div className="sub-h">2-2. 当該資材との関係</div>
          {relations}
          <div className="sub-h">2-3. パッケージが確認できる資料</div>
          {evidence}
          <div className="sub-h">2-4. 申請内容</div>
          <RadioGroup
            legend="申請種別"
            name={field("requestType")}
            options={[
              {
                value: "discontinued",
                label: "終売・廃盤の表示",
                sub: "ページに終売等のステータスを表示します",
              },
              {
                value: "hidden",
                label: "資材ページの非表示",
                sub: "一般ユーザーに表示されない状態にします",
              },
            ]}
          />
          <ApplicationField id={fieldId("reason")} label="申請理由" badges={<RequiredBadge />}>
            <textarea
              className="textarea"
              id={fieldId("reason")}
              maxLength={10000}
              name={field("reason")}
              placeholder="例）2026年3月末をもって製造終了のため"
              required
            />
          </ApplicationField>
          <RadioGroup
            legend="申請理由の開示"
            name={field("discloseReason")}
            options={[
              {
                value: "yes",
                label: "他の関係会社から問い合わせがあった場合、申請理由を開示してよい",
              },
              {
                value: "no",
                label: "開示を希望しない",
                sub: "「関係会社からの申請による」旨のみお伝えします",
              },
            ]}
          />
        </>
      ) : null}

      {kind === "transfer_out" || kind === "transfer_in" ? (
        <>
          <div className="sub-h">2-1. 対象資材</div>
          {materialUrl}
          {materialName}
          {kind === "transfer_in" ? (
            <>
              <div className="sub-h">2-2. 当該資材の現在の資材オーナー企業</div>
              <ApplicationField id={fieldId("ownerName")} label="法人名" badges={<RequiredBadge />}>
                <input
                  className="input"
                  id={fieldId("ownerName")}
                  maxLength={200}
                  name={field("ownerName")}
                  required
                />
              </ApplicationField>
              <ApplicationField
                id={fieldId("ownerInformation")}
                label="その他、分かる情報"
                badges={<OptionalBadge />}
              >
                <textarea
                  className="textarea"
                  id={fieldId("ownerInformation")}
                  maxLength={10000}
                  name={field("ownerInformation")}
                  placeholder="担当部署・担当者名・連絡先など、分かる範囲で"
                />
              </ApplicationField>
            </>
          ) : null}
          <div className="sub-h">
            {kind === "transfer_in"
              ? "2-3. 申請企業の関与を確認できる資料"
              : "2-2. 移行先企業の関与を確認できる資料"}
          </div>
          {evidence}
          <div className="field ev-alt">
            <div className="field-label">
              または、その他、当該資材と貴社との関係を確認できる資料
            </div>
            <div className="fguide">{successionExplanation}</div>
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
