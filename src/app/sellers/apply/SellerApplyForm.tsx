"use client";

import Link from "next/link";
import { type ReactNode, useActionState, useState } from "react";

import {
  describedBy,
  FieldError,
  FormNotice,
  OptionalBadge,
  RequiredBadge,
} from "@/app/_mock/FormParts";
import { MockSubmitButton } from "@/app/_mock/MockSubmitButton";
import { sellerApplyAction } from "@/app/sellers/apply/actions";
import { fieldErrorsOf, initialAuthFormState, submittedValuesOf } from "@/lib/auth/form-state";

const guideStyle = { marginTop: 6, marginBottom: 0 } as const;

type ApplyFieldProps = {
  name: string;
  label: string;
  required: boolean;
  guide?: string;
  error?: string;
  children: (describedById: string | undefined) => ReactNode;
};

/** 見本 S.sellerApply の `.field`（label・入力・.fguide）。 */
function ApplyField({ name, label, required, guide, error, children }: ApplyFieldProps) {
  const guideId = guide === undefined ? undefined : `${name}-guide`;
  return (
    <div className="field">
      <label htmlFor={name}>
        {label} {required ? <RequiredBadge /> : <OptionalBadge />}
      </label>
      {children(describedBy(guideId, error && `${name}-error`))}
      {guide === undefined ? null : (
        <div className="fguide" id={guideId} style={guideStyle}>
          {guide}
        </div>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

/** 見本 S.sellerApply の `.body` の中身（フォーム部分）。項目・検証・送信は本番のまま。 */
export function SellerApplyForm() {
  const [state, formAction] = useActionState(sellerApplyAction, initialAuthFormState);
  const fieldErrors = fieldErrorsOf(state);
  const values = submittedValuesOf(state);
  const hadInvite =
    state.status === "error" && values.inviteCode !== undefined && values.inviteCode.length > 0;
  const [inviteOpen, setInviteOpen] = useState(hadInvite);

  // エラー後の再表示で defaultValue を効かせるため、送信値ごとに form を載せ替える。
  const formKey = state.status === "error" ? `error:${values.officialName ?? ""}` : "idle";
  const invalid = (name: string) => (fieldErrors[name] ? true : undefined);

  return (
    <form action={formAction} key={formKey} noValidate>
      {state.status === "error" ? <FormNotice tone="error">{state.message}</FormNotice> : null}

      <ApplyField name="officialName" label="法人名" required error={fieldErrors.officialName}>
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("officialName")}
            autoComplete="organization"
            className="input"
            defaultValue={values.officialName}
            id="officialName"
            name="officialName"
            placeholder="〇〇株式会社"
            required
            type="text"
          />
        )}
      </ApplyField>

      <div className="field">
        <label htmlFor="corporateNumber">
          法人番号 <RequiredBadge />
        </label>
        <input
          aria-describedby={describedBy(
            "corporateNumber-guide",
            fieldErrors.corporateNumber && "corporateNumber-error",
          )}
          aria-invalid={invalid("corporateNumber")}
          className="input"
          defaultValue={values.corporateNumber}
          id="corporateNumber"
          inputMode="numeric"
          maxLength={13}
          name="corporateNumber"
          required
        />
        <div className="fguide" id="corporateNumber-guide" style={guideStyle}>
          13桁の法人番号を入力してください。
        </div>
        <FieldError id="corporateNumber-error" message={fieldErrors.corporateNumber} />
        <div
          style={{
            marginTop: 8,
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 9,
            padding: "9px 12px",
            fontSize: 11.5,
            color: "var(--ink-2)",
            lineHeight: 1.7,
          }}
        >
          ログインIDは運営が発行します。パスワードは、ご案内する設定用ページで設定してください。
        </div>
      </div>

      <ApplyField
        name="contactEmail"
        label="連絡先メールアドレス"
        required
        guide="ご担当者のメールアドレスを入力してください。公開されません。確認後、このアドレスにログインIDとパスワード設定用のご案内をお送りします。"
        error={fieldErrors.contactEmail}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("contactEmail")}
            autoComplete="email"
            className="input"
            defaultValue={values.contactEmail}
            id="contactEmail"
            name="contactEmail"
            placeholder="contact@example.com"
            required
            type="email"
          />
        )}
      </ApplyField>

      <ApplyField
        name="contactName"
        label="ご担当者名・部署"
        required
        guide="公開されません"
        error={fieldErrors.contactName}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("contactName")}
            autoComplete="name"
            className="input"
            defaultValue={values.contactName}
            id="contactName"
            name="contactName"
            placeholder="担当 太郎"
            required
            type="text"
          />
        )}
      </ApplyField>

      <ApplyField
        name="location"
        label="本社・主な拠点の所在地"
        required={false}
        error={fieldErrors.location}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("location")}
            autoComplete="street-address"
            className="input"
            defaultValue={values.location}
            id="location"
            name="location"
            placeholder="東京都〇〇区…"
            type="text"
          />
        )}
      </ApplyField>

      <ApplyField
        name="contactPhone"
        label="ご担当者電話番号"
        required
        guide="公開されません。確認が必要な場合の連絡に使用します。"
        error={fieldErrors.contactPhone}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("contactPhone")}
            autoComplete="tel"
            className="input"
            defaultValue={values.contactPhone}
            id="contactPhone"
            maxLength={20}
            name="contactPhone"
            required
            type="tel"
          />
        )}
      </ApplyField>

      <ApplyField
        name="materialRequestNotes"
        label="備考：掲載・編集を希望する資材"
        required={false}
        guide="掲載済みで編集したい資材、またはこれから掲載したい資材の正式名称を記入してください。"
        error={fieldErrors.materialRequestNotes}
      >
        {(described) => (
          <textarea
            aria-describedby={described}
            aria-invalid={invalid("materialRequestNotes")}
            className="textarea"
            defaultValue={values.materialRequestNotes}
            id="materialRequestNotes"
            maxLength={2000}
            name="materialRequestNotes"
          />
        )}
      </ApplyField>

      <ApplyField
        name="websiteUrl"
        label="公式サイトURL"
        required={false}
        error={fieldErrors.websiteUrl}
      >
        {(described) => (
          <input
            aria-describedby={described}
            aria-invalid={invalid("websiteUrl")}
            autoComplete="url"
            className="input"
            defaultValue={values.websiteUrl}
            id="websiteUrl"
            name="websiteUrl"
            placeholder="https://…"
            type="url"
          />
        )}
      </ApplyField>

      {inviteOpen ? (
        <ApplyField
          name="inviteCode"
          label="招待コード"
          required={false}
          error={fieldErrors.inviteCode}
        >
          {(described) => (
            <input
              aria-describedby={described}
              aria-invalid={invalid("inviteCode")}
              autoCapitalize="none"
              autoComplete="off"
              className="input"
              defaultValue={values.inviteCode}
              id="inviteCode"
              name="inviteCode"
              placeholder="案内に記載のコード"
              spellCheck={false}
              type="text"
            />
          )}
        </ApplyField>
      ) : null}

      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.8, margin: "6px 0 14px" }}>
        申請前に
        <Link href="/legal/manufacturer" target="_blank" rel="noopener noreferrer">
          Farmille企業向けサービス利用規約（別タブ）
        </Link>
        と
        <Link href="/legal" target="_blank" rel="noopener noreferrer">
          各規約・ガイドライン（別タブ）
        </Link>
        をご確認ください。
      </p>
      <div className="form-actions">
        <MockSubmitButton label="申請する" pendingLabel="申請中…" />
        <button
          aria-expanded={inviteOpen}
          className="draft"
          onClick={() => setInviteOpen((open) => !open)}
          style={{ background: "none", border: 0, width: "100%", font: "inherit" }}
          type="button"
        >
          {inviteOpen
            ? "招待コード入力を閉じる"
            : "Farmilleからのご案内で登録される方はこちら（招待コード入力）"}
        </button>
      </div>
    </form>
  );
}
