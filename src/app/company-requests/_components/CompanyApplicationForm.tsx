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

import { css, cx } from "../../../../styled-system/css";
import { Button } from "@/components/Button";
import {
  CheckboxGroup,
  Field,
  Fieldset,
  Form,
  FormActions,
  Input,
  Notice,
  RadioGroup,
  SubmitButton,
  Textarea,
} from "@/components/form";
import { SectionHeading } from "@/components/SectionHeading";
import { SurfaceCard } from "@/components/SurfaceCard";
import { submitApplication } from "../actions";
import { ConsentFields } from "./ConsentFields";
import { ContactFields, emptyContact, type ContactDefaults } from "./ContactFields";
import { EvidenceFields } from "./EvidenceFields";

const stackStyle = css({ display: "flex", flexDirection: "column", gap: "4" });

// fieldset 既定の枠と余白を外し、送信中は中の入力をまとめて無効にする。
const fieldsetStyle = css({ borderWidth: "0", p: "0", m: "0", minW: "0" });

const introTextStyle = css({ fontSize: "md", lineHeight: "relaxed" });

const introListStyle = css({
  mt: "2.5",
  pl: "4.5",
  fontSize: "md",
  lineHeight: "relaxed",
  listStyle: "disc",
});

const RELATION_OPTIONS = Object.entries(relationLabels).map(([value, label]) => ({ value, label }));

const TARGET_OPTIONS = [
  { value: "new", label: "資材情報の新規掲載" },
  { value: "existing", label: "掲載済み資材の資材オーナー権限" },
] as const satisfies readonly { value: ItemRow["target"]; label: string }[];

const noteStyle = css({ mt: "2" });

const orStyle = css({ my: "2", textAlign: "center", fontSize: "xs", color: "text.subtle" });

type ItemRow = { id: string; target: "new" | "existing" };

function IntroCard({ text }: { text: string }) {
  const [lead, list = ""] = text.split("\n\n");
  const bullets = list
    .split(/(?:^|\s)・/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return (
    <SurfaceCard padding="cozy" tone="soft">
      <p className={introTextStyle}>{lead}</p>
      {bullets.length > 0 ? (
        <ul className={introListStyle}>
          {bullets.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      ) : null}
    </SurfaceCard>
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
    <Form onSubmit={submit}>
      <fieldset className={cx(fieldsetStyle, stackStyle)} disabled={submitting}>
        <IntroCard text={copy.introduction} />
        <Notice tone="neutral">
          担当者情報・ご提出資料は公開されません。申請の保存後に運営が内容を確認します。
        </Notice>

        <SurfaceCard title={titles.company}>
          <ContactFields defaults={defaults} fixedAccount />
        </SurfaceCard>

        <section className={stackStyle}>
          <SectionHeading title={titles.items} />
          <Notice tone="neutral">
            複数ある場合は「資材を追加」で資材ごとに繰り返し入力してください。資材名はパッケージ記載の正式名称を入力してください。
          </Notice>
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
          <Button
            disabled={rows.length >= 100 || submitting}
            onClick={() =>
              setRows((previous) => [
                ...previous,
                { id: crypto.randomUUID(), target: kind === "registration" ? "new" : "existing" },
              ])
            }
            variant="ghost"
          >
            ＋ 資材を追加
          </Button>
        </section>

        {kind === "transfer_out" ? (
          <SurfaceCard title="移行先企業情報">
            <ContactFields prefix="destination." defaults={emptyContact} />
          </SurfaceCard>
        ) : null}
        {kind === "transfer_in" ? (
          <>
            <SurfaceCard title="移行の経緯">
              <Field label="申請の経緯" name="background" requirement="required">
                <Textarea
                  maxLength={10000}
                  placeholder="例：事業譲渡により当該資材に関する事業を承継した"
                />
              </Field>
            </SurfaceCard>
            <SurfaceCard title="経緯を確認できる資料">
              <Notice className={noteStyle} tone="warn">
                {historyExplanation}
              </Notice>
              <Field
                label="現オーナー企業の同意が確認できる資料（メール等の写し）"
                requirement="optional"
              >
                <EvidenceFields
                  intentId={intentId}
                  itemKey={null}
                  onBusy={onBusy}
                  purpose="owner_agreement"
                />
              </Field>
              <Field
                label="移行の事実が確認できる資料（官報公告・プレスリリース・契約書等）"
                requirement="optional"
              >
                <EvidenceFields
                  intentId={intentId}
                  itemKey={null}
                  onBusy={onBusy}
                  purpose="succession"
                />
              </Field>
            </SurfaceCard>
          </>
        ) : null}

        <ConsentFields kind={kind} />

        <SurfaceCard title="署名">
          <Field label="申請日" name="applicationDate" requirement="required">
            <Input
              defaultValue={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })}
              type="date"
            />
          </Field>
          <Field label={SIGNER_LABELS[kind]} name="signerName" requirement="required">
            <Input maxLength={200} placeholder="記入例）金子 太郎" />
          </Field>
        </SurfaceCard>

        <Notice tone="neutral">
          受付番号と回答の控えを企業会員の登録連絡先「{recipient}
          」へ送信します。審査後の連絡先は、入力した担当者メールアドレスです。
        </Notice>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <FormActions>
          <SubmitButton
            disabled={uploads > 0}
            pending={submitting}
            pendingLabel="申請を保存しています…"
          >
            内容を確認して申請する
          </SubmitButton>
          <Notice tone="neutral">完了時、または資料に不足がある場合にメールでご連絡します</Notice>
        </FormActions>
      </fieldset>
    </Form>
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
  const materialName = (
    <Field
      description="※パッケージ記載の正式名称"
      label="資材名"
      name={field("materialName")}
      requirement="required"
    >
      <Input maxLength={300} placeholder="パッケージ記載の正式名称" />
    </Field>
  );
  const materialUrl =
    row.target === "existing" ? (
      <Field
        description={kind === "registration" ? "掲載済み資材の場合は必須です。" : undefined}
        label="FarmilleページURL"
        name={field("materialUrl")}
        requirement="required"
      >
        <Input maxLength={2000} placeholder="https://www.farmille.com/materials/…" type="url" />
      </Field>
    ) : null;
  const relations = (
    <Fieldset
      description={relationExplanation}
      legend="当該資材との関係（複数選択可）"
      name={field("relations")}
      requirement="required"
    >
      <CheckboxGroup options={RELATION_OPTIONS} variant="chips" />
    </Fieldset>
  );
  // 添付と URL のどちらか一方があればよいので、組だけを必須にし、中の2つは見出しを隠した任意の欄にする
  const evidence = (
    <Fieldset
      description={`${
        kind === "transfer_out"
          ? "移行先企業名がパッケージ上に明記されていることが確認できる画像・PDF、またはパッケージが確認できる製品ページURLをご提出ください。"
          : evidenceExplanation
      }資料の添付、または資料URLのいずれかが必須です。`}
      legend={
        kind === "transfer_out"
          ? "移行先企業の関与を確認できる資料"
          : kind === "transfer_in"
            ? "貴社の企業名が当該資材のパッケージ上に明記されていることが確認できる資料"
            : "パッケージが確認できる資料"
      }
      requirement="required"
    >
      <Field hideLabel label="パッケージ・ラベルの資料" requirement="optional">
        <EvidenceFields
          intentId={intentId}
          itemKey={row.id}
          onBusy={onBusy}
          onCount={(count) => onCount(`${row.id}.package`, count)}
          purpose="package"
        />
      </Field>
      <p className={orStyle}>または</p>
      <Field
        hideLabel
        label="パッケージが確認できる製品ページURL"
        name={field("evidenceUrl")}
        requirement="optional"
      >
        <Input
          maxLength={2000}
          placeholder="パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL（https://）"
          type="url"
        />
      </Field>
    </Fieldset>
  );

  return (
    <SurfaceCard title={`資材 ${index + 1}`}>
      {kind === "registration" ? (
        <>
          <SectionHeading title="2-1. 申請内容" />
          <Fieldset legend="申請内容" name={field("target")} requirement="required">
            <RadioGroup onValueChange={onTarget} options={TARGET_OPTIONS} value={row.target} />
          </Fieldset>
          <SectionHeading title="2-2. 対象資材" />
          {materialName}
          {materialUrl}
          <Field label="製品公式ページURL" name={field("officialUrl")} requirement="optional">
            <Input maxLength={2000} placeholder="https://" type="url" />
          </Field>
          <SectionHeading title="2-3. 当該資材との関係" />
          {relations}
          <SectionHeading title="2-4. パッケージが確認できる資料" />
          {evidence}
        </>
      ) : null}

      {kind === "transfer_out" || kind === "transfer_in" ? (
        <>
          <SectionHeading title="2-1. 対象資材" />
          {materialUrl}
          {materialName}
          {kind === "transfer_in" ? (
            <>
              <SectionHeading title="2-2. 当該資材の現在の資材オーナー企業" />
              <Field label="法人名" name={field("ownerName")} requirement="required">
                <Input maxLength={200} />
              </Field>
              <Field
                label="その他、分かる情報"
                name={field("ownerInformation")}
                requirement="optional"
              >
                <Textarea
                  maxLength={10000}
                  placeholder="担当部署・担当者名・連絡先など、分かる範囲で"
                />
              </Field>
            </>
          ) : null}
          <SectionHeading
            title={
              kind === "transfer_in"
                ? "2-3. 申請企業の関与を確認できる資料"
                : "2-2. 移行先企業の関与を確認できる資料"
            }
          />
          {evidence}
          <Field
            description={successionExplanation}
            label="または、その他、当該資材と貴社との関係を確認できる資料"
          >
            <EvidenceFields
              intentId={intentId}
              itemKey={row.id}
              onBusy={onBusy}
              onCount={(count) => onCount(`${row.id}.involvement`, count)}
              purpose="involvement"
            />
          </Field>
        </>
      ) : null}

      {removable ? (
        <>
          <Notice className={noteStyle} tone="warn">
            添付がある場合は、資料を削除してから資材を削除してください。
          </Notice>
          <Button disabled={removeDisabled} onClick={onRemove} size="sm" variant="danger">
            この資材を削除
          </Button>
        </>
      ) : null}
    </SurfaceCard>
  );
}
