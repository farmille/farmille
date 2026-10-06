"use client";

import { Checkbox } from "@/components/Checkbox";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, SurfaceCard } from "@/components";
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
import * as v from "valibot";
import { errorMessageJa } from "@/server/errors";
import { submitApplication, restartRemoval } from "../actions";
import {
  ContactFields,
  emptyContact,
  applicationStack,
  applicationField,
  type ContactDefaults,
} from "./ContactFields";
import { ConsentFields } from "./ConsentFields";
import { EvidenceFields } from "./EvidenceFields";

type ItemRow = { id: string; target: "new" | "existing" };
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
  return (
    <form onSubmit={submit} className={applicationStack}>
      <p>{copy.introduction}</p>
      {kind === "removal" && (
        <div>
          <p>
            途中でページを閉じた場合、入力内容は復元されません。残った添付を破棄するには、最初から入力してください。
          </p>
          <Button
            type="button"
            variant="ghost"
            disabled={submitting || uploads > 0}
            onClick={() => void restart()}
          >
            入力と添付を破棄して最初から入力
          </Button>
        </div>
      )}
      <p>担当者情報・ご提出資料は公開されません。申請の保存後に運営が内容を確認します。</p>
      <fieldset disabled={submitting} className={applicationStack}>
        <legend>申請企業情報</legend>
        <ContactFields
          defaults={defaults}
          removal={kind === "removal"}
          fixedAccount={kind !== "removal"}
        />
        {kind === "removal" && (
          <label className={applicationField}>
            会社概要ページURL（必須）
            <Input name="companyUrl" type="url" required maxLength={2000} />
          </label>
        )}
      </fieldset>
      <h2>対象資材</h2>
      <p>
        複数ある場合は、資材ごとに追加してください。資材名はパッケージ記載の正式名称を入力してください。
      </p>
      {rows.map((row, index) => (
        <SurfaceCard key={row.id} title={`資材 ${index + 1}`}>
          <div className={applicationStack}>
            {kind === "registration" && (
              <label className={applicationField}>
                申請内容（必須）
                <Select
                  value={row.target}
                  onChange={(event) => {
                    const target = v.parse(v.picklist(["new", "existing"]), event.target.value);
                    setRows((previous) =>
                      previous.map((item) => (item.id === row.id ? { ...item, target } : item)),
                    );
                  }}
                >
                  <option value="new">資材情報の新規掲載</option>
                  <option value="existing">掲載済み資材の資材オーナー権限</option>
                </Select>
              </label>
            )}
            <label className={applicationField}>
              資材名（必須）
              <Input name={`${row.id}.materialName`} required maxLength={300} />
            </label>
            {row.target === "existing" && (
              <label className={applicationField}>
                FarmilleページURL（必須）
                <Input name={`${row.id}.materialUrl`} type="url" required maxLength={2000} />
              </label>
            )}
            {kind === "registration" && (
              <label className={applicationField}>
                製品公式ページURL（任意）
                <Input name={`${row.id}.officialUrl`} type="url" maxLength={2000} />
              </label>
            )}
            {(kind === "registration" || kind === "removal") && (
              <fieldset className={applicationStack}>
                <legend>当該資材との関係（1つ以上必須）</legend>
                {Object.entries(relationLabels).map(([value, label]) => (
                  <label key={value}>
                    <Checkbox name={`${row.id}.relations`} value={value} /> {label}
                  </label>
                ))}
                <p>{relationExplanation}</p>
              </fieldset>
            )}
            {kind === "transfer_in" && (
              <>
                <label className={applicationField}>
                  現在の資材オーナー企業の法人名（必須）
                  <Input name={`${row.id}.ownerName`} required maxLength={200} />
                </label>
                <label className={applicationField}>
                  その他、分かる情報（任意）
                  <Textarea name={`${row.id}.ownerInformation`} maxLength={10000} />
                </label>
              </>
            )}
            <h3>
              {kind === "transfer_out"
                ? "移行先企業の関与を確認できる資料"
                : "パッケージが確認できる資料"}
            </h3>
            <p>
              {kind === "transfer_out"
                ? "移行先企業名がパッケージ上に明記されていることが確認できる画像・PDF、またはパッケージが確認できる製品ページURLをご提出ください。"
                : evidenceExplanation}
            </p>
            <EvidenceFields
              intentId={intentId}
              itemKey={row.id}
              purpose="package"
              label="パッケージ・ラベルの資料"
              onBusy={onBusy}
              onCount={(count) => countFiles(`${row.id}.package`, count)}
            />
            <label className={applicationField}>
              パッケージが確認できる製品ページURL
              <Input name={`${row.id}.evidenceUrl`} type="url" maxLength={2000} />
            </label>
            {(kind === "transfer_out" || kind === "transfer_in") && (
              <>
                <p>{successionExplanation}</p>
                <EvidenceFields
                  intentId={intentId}
                  itemKey={row.id}
                  purpose="involvement"
                  label="その他、資材との関係を確認できる資料"
                  onBusy={onBusy}
                  onCount={(count) => countFiles(`${row.id}.involvement`, count)}
                />
              </>
            )}
            <p>資料の添付、または資料URLのいずれかが必須です。</p>
            {kind === "removal" && (
              <>
                <label className={applicationField}>
                  申請種別（必須）
                  <Select name={`${row.id}.requestType`} required defaultValue="">
                    <option value="" disabled>
                      選択してください
                    </option>
                    <option value="discontinued">終売・廃盤の表示</option>
                    <option value="hidden">資材ページの非表示</option>
                  </Select>
                </label>
                <label className={applicationField}>
                  申請理由（必須）
                  <Textarea
                    name={`${row.id}.reason`}
                    required
                    maxLength={10000}
                    placeholder="例：2026年3月末をもって製造終了のため"
                  />
                </label>
                <fieldset className={applicationStack}>
                  <legend>他の関係会社から問い合わせがあった場合の申請理由の開示（必須）</legend>
                  <label>
                    <input type="radio" name={`${row.id}.discloseReason`} value="yes" required />{" "}
                    開示してよい
                  </label>
                  <label>
                    <input type="radio" name={`${row.id}.discloseReason`} value="no" required />{" "}
                    開示を希望しない（「関係会社からの申請による」旨のみお伝えします）
                  </label>
                </fieldset>
              </>
            )}
            {rows.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={
                    uploads > 0 ||
                    (counts.get(`${row.id}.package`) ?? 0) > 0 ||
                    (counts.get(`${row.id}.involvement`) ?? 0) > 0
                  }
                  onClick={() =>
                    setRows((previous) => previous.filter((item) => item.id !== row.id))
                  }
                >
                  この資材を削除
                </Button>
                <p>添付がある場合は、資料を削除してから資材を削除してください。</p>
              </>
            )}
          </div>
        </SurfaceCard>
      ))}
      <Button
        type="button"
        variant="ghost"
        disabled={rows.length >= 100 || submitting}
        onClick={() =>
          setRows((previous) => [
            ...previous,
            { id: crypto.randomUUID(), target: kind === "registration" ? "new" : "existing" },
          ])
        }
      >
        資材を追加
      </Button>
      {kind === "transfer_out" && (
        <section className={applicationStack}>
          <h2>移行先企業情報</h2>
          <ContactFields prefix="destination." defaults={emptyContact} />
        </section>
      )}
      {kind === "transfer_in" && (
        <section className={applicationStack}>
          <h2>移行の経緯</h2>
          <label className={applicationField}>
            申請の経緯（必須）
            <Textarea
              name="background"
              required
              maxLength={10000}
              placeholder="例：事業譲渡により当該資材に関する事業を承継した"
            />
          </label>
          <h2>経緯を確認できる資料</h2>
          <p>{historyExplanation}</p>
          <EvidenceFields
            intentId={intentId}
            itemKey={null}
            purpose="owner_agreement"
            label="現オーナー企業の同意が確認できる資料（任意、メール等の写し）"
            onBusy={onBusy}
          />
          <EvidenceFields
            intentId={intentId}
            itemKey={null}
            purpose="succession"
            label="移行の事実が確認できる資料（任意、官報公告・プレスリリース・契約書等）"
            onBusy={onBusy}
          />
        </section>
      )}
      <ConsentFields kind={kind} />
      <label className={applicationField}>
        申請日（必須）
        <Input
          name="applicationDate"
          type="date"
          required
          defaultValue={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })}
        />
      </label>
      <label className={applicationField}>
        署名・担当者名（必須）
        <Input name="signerName" required maxLength={200} />
      </label>
      <p>
        受付番号と回答の控えを
        {kind === "removal" ? "確認済みメール" : "企業会員の登録連絡先"}「{recipient}
        」へ送信します。審査後の連絡先は、入力した担当者メールアドレスです。
      </p>
      {error && <p role="alert">{error}</p>}
      <Button type="submit" disabled={submitting || uploads > 0}>
        {submitting ? "申請を保存しています…" : "内容を確認して申請する"}
      </Button>
    </form>
  );
}
