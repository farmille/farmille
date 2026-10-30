"use client";

import { Icon } from "@/components/Icon";
import { useActionState, useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import * as v from "valibot";

import { applicationCopy } from "@/lib/company-application-copy";
import {
  companyApplicationSchema,
  relationLabels,
  relationSchema,
  relationExplanation,
  evidenceExplanation,
  successionExplanation,
  historyExplanation,
  uuidSchema,
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
  type RestoredFields,
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

const introTextStyle = css({ textStyle: "supporting" });

const introListStyle = css({
  mt: "2.5",
  pl: "4.5",
  textStyle: "supporting",
  listStyle: "disc",
});

const RELATION_OPTIONS = relationSchema.options.map((value) => ({
  value,
  label: relationLabels[value],
}));

const TARGET_OPTIONS = [
  { value: "new", label: "資材の新規掲載" },
  { value: "existing", label: "掲載済み資材の資材オーナー権限" },
] as const satisfies readonly { value: ItemRow["target"]; label: string }[];

const TargetSchema = v.picklist(TARGET_OPTIONS.map((option) => option.value));

const noteStyle = css({ mt: "2" });

const orStyle = css({ my: "2", textAlign: "center", fontSize: "xs", color: "text.subtle" });

type ItemRow = {
  id: string;
  target: "new" | "existing";
  materialName: string;
  materialUrl: string;
  officialUrl: string;
  evidenceUrl: string;
  relations: v.InferOutput<typeof relationSchema>[];
  ownerName: string;
  ownerInformation: string;
};

type ApplicationValues = {
  contact: ContactDefaults;
  destination: ContactDefaults;
  rows: ItemRow[];
  background: string;
  applicationDate: string;
  signerName: string;
  consents: boolean[];
};

function emptyItem(id: string, target: ItemRow["target"]): ItemRow {
  return {
    id,
    target,
    materialName: "",
    materialUrl: "",
    officialUrl: "",
    evidenceUrl: "",
    relations: [],
    ownerName: "",
    ownerInformation: "",
  };
}

function restoredContact(
  restored: RestoredFields,
  prefix: string,
  defaults: ContactDefaults,
): ContactDefaults {
  return {
    companyName: restored.get(`${prefix}companyName`)?.[0] ?? defaults.companyName,
    corporateNumber: restored.get(`${prefix}corporateNumber`)?.[0] ?? defaults.corporateNumber,
    accountId: restored.get(`${prefix}accountId`)?.[0] ?? defaults.accountId,
    contactName: restored.get(`${prefix}contactName`)?.[0] ?? defaults.contactName,
    department: restored.get(`${prefix}department`)?.[0] ?? defaults.department,
    email: restored.get(`${prefix}email`)?.[0] ?? defaults.email,
    phone: restored.get(`${prefix}phone`)?.[0] ?? defaults.phone,
  };
}

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
  const defaultTarget = kind === "registration" ? "new" : "existing";

  const [initialValues] = useReducer(
    (values: ApplicationValues) => values,
    null,
    () => ({
      contact: defaults,
      destination: emptyContact,
      rows: [emptyItem(intentId, defaultTarget)],
      background: "",
      applicationDate: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }),
      signerName: "",
      consents: applicationCopy[kind].consents.map(() => false),
    }),
  );

  const form = useForm({ defaultValues: initialValues });
  const values = useStore(form.store, (state) => state.values);
  const { rows } = values;

  const [counts, countEvidence] = useReducer(
    (previous: Map<string, number>, entry: { key: string; count: number }) =>
      new Map(previous).set(entry.key, entry.count),
    new Map<string, number>(),
  );

  const [uploads, onBusy] = useReducer(
    (count: number, busy: boolean) => count + (busy ? 1 : -1),
    0,
  );

  const copy = applicationCopy[kind];
  const titles = SECTION_TITLES[kind];

  function countFiles(key: string, count: number) {
    countEvidence({ key, count });
  }

  // 資材の欄の名前は行 ID を含むので、控えの行と入力をまとめて戻す。添付資料は付け直してもらう。
  function restore(restored: RestoredFields) {
    const restoredRows = [...restored.keys()].flatMap((name) => {
      const id = /^(.+)\.materialName$/.exec(name)?.[1];

      if (!v.is(uuidSchema, id)) return [];
      const target = v.safeParse(TargetSchema, restored.get(`${id}.target`)?.[0]);
      const relations = v.safeParse(v.array(relationSchema), restored.get(`${id}.relations`) ?? []);

      return [
        {
          id,
          target: target.success ? target.output : defaultTarget,
          materialName: restored.get(`${id}.materialName`)?.[0] ?? "",
          materialUrl: restored.get(`${id}.materialUrl`)?.[0] ?? "",
          officialUrl: restored.get(`${id}.officialUrl`)?.[0] ?? "",
          evidenceUrl: restored.get(`${id}.evidenceUrl`)?.[0] ?? "",
          relations: relations.success ? relations.output : [],
          ownerName: restored.get(`${id}.ownerName`)?.[0] ?? "",
          ownerInformation: restored.get(`${id}.ownerInformation`)?.[0] ?? "",
        },
      ];
    });

    form.setFieldValue("contact", restoredContact(restored, "", initialValues.contact));
    form.setFieldValue(
      "destination",
      restoredContact(restored, "destination.", initialValues.destination),
    );
    form.setFieldValue("rows", restoredRows.length > 0 ? restoredRows : initialValues.rows);
    form.setFieldValue("background", restored.get("background")?.[0] ?? initialValues.background);
    form.setFieldValue(
      "applicationDate",
      restored.get("applicationDate")?.[0] ?? initialValues.applicationDate,
    );
    form.setFieldValue("signerName", restored.get("signerName")?.[0] ?? initialValues.signerName);
    form.setFieldValue(
      "consents",
      copy.consents.map((_, index) => restored.get(`consent.${index}`)?.includes("on") ?? false),
    );
  }

  const [error, submit, submitting] = useActionState(
    async (_previous: string, _data: FormData): Promise<string> => {
      const current = form.state.values;

      const input = v.safeParse(companyApplicationSchema, {
        ...current.contact,
        kind,
        items: current.rows.map((row) => ({
          ...row,
          materialUrl: row.target === "new" ? "" : row.materialUrl,
        })),
        destination: current.destination,
        background: current.background,
        signerName: current.signerName,
        applicationDate: current.applicationDate,
        consents: current.consents,
      });

      if (!input.success) return `入力内容を確認してください。${v.summarize(input.issues)}`;

      try {
        const result = await submitApplication({ intentId, input: input.output });

        if (!result.ok)
          return `${errorMessageJa[result.error]} 資材URL・移行先ID・必須資料もご確認ください。`;
        router.push(`/dashboard/applications/${result.data}`);

        return "";
      } catch {
        return "申請結果を確認できませんでした。入力内容はこの画面に残っています。同じ内容で再送しても、申請は重複しません。";
      }
    },
    "",
  );

  return (
    <Form action={submit} onRestore={restore} persist="application">
      <fieldset className={cx(fieldsetStyle, stackStyle)} disabled={submitting}>
        <IntroCard text={copy.introduction} />
        <Notice tone="neutral">
          担当者情報・ご提出資料は公開されません。申請の保存後に運営が内容を確認します。
        </Notice>

        <SurfaceCard title={titles.company}>
          <ContactFields
            values={values.contact}
            onChange={(name, value) => form.setFieldValue(`contact.${name}`, value)}
            fixedAccount
          />
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
              onRemove={() =>
                form.setFieldValue("rows", (previous) =>
                  previous.filter((item) => item.id !== row.id),
                )
              }
              onChange={(next) =>
                form.setFieldValue("rows", (previous) =>
                  previous.map((item) => (item.id === row.id ? next : item)),
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
              form.setFieldValue("rows", (previous) => [
                ...previous,
                emptyItem(crypto.randomUUID(), defaultTarget),
              ])
            }
            variant="ghost"
          >
            <Icon name="add" size="sm" /> 資材を追加
          </Button>
        </section>

        {kind === "transfer_out" ? (
          <SurfaceCard title="移行先企業情報">
            <ContactFields
              prefix="destination."
              values={values.destination}
              onChange={(name, value) => form.setFieldValue(`destination.${name}`, value)}
            />
          </SurfaceCard>
        ) : null}
        {kind === "transfer_in" ? (
          <>
            <SurfaceCard title="移行の経緯">
              <Textarea
                label="申請の経緯"
                name="background"
                value={values.background}
                onChange={(event) => form.setFieldValue("background", event.target.value)}
                requirement="required"
                maxLength={10000}
                placeholder="例：事業譲渡により当該資材に関する事業を承継した"
              />
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

        <ConsentFields
          kind={kind}
          values={values.consents}
          onChange={(index, checked) =>
            form.setFieldValue("consents", (previous) =>
              previous.map((value, i) => (i === index ? checked : value)),
            )
          }
        />

        <SurfaceCard title="署名">
          <Input
            label="申請日"
            name="applicationDate"
            requirement="required"
            value={values.applicationDate}
            onChange={(event) => form.setFieldValue("applicationDate", event.target.value)}
            type="date"
          />
          <Input
            label={SIGNER_LABELS[kind]}
            name="signerName"
            value={values.signerName}
            onChange={(event) => form.setFieldValue("signerName", event.target.value)}
            requirement="required"
            maxLength={200}
            placeholder="金子 太郎"
          />
        </SurfaceCard>

        <Notice tone="neutral">
          受付番号と回答の控えを企業会員の登録連絡先「{recipient}
          」へ送信します。審査後の連絡先は、入力した担当者メールアドレスです。
        </Notice>
        {!submitting && error ? <Notice tone="error">{error}</Notice> : null}
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
  onChange,
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
  onChange: (row: ItemRow) => void;
  onBusy: (busy: boolean) => void;
  onCount: (key: string, count: number) => void;
}) {
  const field = (name: string) => `${row.id}.${name}`;

  const materialName = (
    <Input
      description="※パッケージ記載の正式名称"
      label="資材名"
      name={field("materialName")}
      value={row.materialName}
      onChange={(event) => onChange({ ...row, materialName: event.target.value })}
      requirement="required"
      maxLength={300}
      placeholder="パッケージ記載の正式名称"
    />
  );

  const materialUrl =
    row.target === "existing" ? (
      <Input
        description={kind === "registration" ? "掲載済み資材の場合は必須です。" : undefined}
        label="FarmilleページURL"
        name={field("materialUrl")}
        value={row.materialUrl}
        onChange={(event) => onChange({ ...row, materialUrl: event.target.value })}
        requirement="required"
        maxLength={2000}
        placeholder="https://www.farmille.com/materials/…"
        type="url"
      />
    ) : null;

  const relations = (
    <CheckboxGroup
      description={relationExplanation}
      label="当該資材との関係（複数選択可）"
      name={field("relations")}
      value={row.relations}
      onValueChange={(relations) => onChange({ ...row, relations })}
      requirement="required"
      options={RELATION_OPTIONS}
      variant="chips"
    />
  );

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
      <Input
        hideLabel
        label="パッケージが確認できる製品ページURL"
        name={field("evidenceUrl")}
        value={row.evidenceUrl}
        onChange={(event) => onChange({ ...row, evidenceUrl: event.target.value })}
        requirement="optional"
        maxLength={2000}
        placeholder="パッケージ画像が掲載されている公式サイト・ECサイトの製品ページURL（https://）"
        type="url"
      />
    </Fieldset>
  );

  return (
    <SurfaceCard title={`資材 ${index + 1}`}>
      {kind === "registration" ? (
        <>
          <SectionHeading title="2-1. 申請内容" />
          <RadioGroup
            label="申請内容"
            name={field("target")}
            requirement="required"
            onValueChange={(target) => onChange({ ...row, target })}
            options={TARGET_OPTIONS}
            value={row.target}
          />
          <SectionHeading title="2-2. 対象資材" />
          {materialName}
          {materialUrl}
          <Input
            label="製品公式ページURL"
            name={field("officialUrl")}
            value={row.officialUrl}
            onChange={(event) => onChange({ ...row, officialUrl: event.target.value })}
            requirement="optional"
            maxLength={2000}
            placeholder="https://"
            type="url"
          />
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
              <Input
                label="法人名"
                name={field("ownerName")}
                value={row.ownerName}
                onChange={(event) => onChange({ ...row, ownerName: event.target.value })}
                requirement="required"
                maxLength={200}
              />
              <Textarea
                label="その他、分かる情報"
                name={field("ownerInformation")}
                value={row.ownerInformation}
                onChange={(event) => onChange({ ...row, ownerInformation: event.target.value })}
                requirement="optional"
                maxLength={10000}
                placeholder="担当部署・担当者名・連絡先など、分かる範囲で"
              />
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
