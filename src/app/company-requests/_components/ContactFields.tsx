import type { ReactNode } from "react";

import { OptionalBadge, RequiredBadge } from "@/app/_mock/FormParts";

export type ContactDefaults = {
  companyName: string;
  corporateNumber: string;
  accountId: string;
  contactName: string;
  department: string;
  email: string;
  phone: string;
};
export const emptyContact: ContactDefaults = {
  companyName: "",
  corporateNumber: "",
  accountId: "",
  contactName: "",
  department: "",
  email: "",
  phone: "",
};

/** 見本の PRIV（公開されません）。 */
export function PrivateNote() {
  return (
    <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>
      公開されません
    </span>
  );
}

/** 見本 formScreen の `.field`（見出し・案内・入力）。案内は見本どおり入力の下に置く。 */
export function ApplicationField({
  id,
  label,
  badges,
  guide,
  children,
}: {
  id: string;
  label: string;
  badges: ReactNode;
  guide?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {badges}
      </label>
      {children}
      {guide === undefined ? null : (
        <div className="fguide" id={`${id}-guide`} style={{ marginTop: 6, marginBottom: 0 }}>
          {guide}
        </div>
      )}
    </div>
  );
}

const requiredPrivate = (
  <>
    <RequiredBadge /> <PrivateNote />
  </>
);

/**
 * 見本の companyFields（D は法人番号なし・アカウントID任意）。name は本番どおり `${prefix}companyName` など。
 * D の法人名・担当者名・メールは確認済みの値で、書き換えられない（本番どおり）。
 */
export function ContactFields({
  prefix = "",
  defaults,
  removal = false,
  fixedAccount = false,
}: {
  prefix?: string;
  defaults: ContactDefaults;
  removal?: boolean;
  fixedAccount?: boolean;
}) {
  const id = (name: string) => `${prefix.replace(/\W/g, "-")}${name}`;
  return (
    <>
      <ApplicationField id={id("companyName")} label="法人名" badges={<RequiredBadge />}>
        <input
          className="input"
          defaultValue={defaults.companyName}
          id={id("companyName")}
          maxLength={200}
          name={`${prefix}companyName`}
          placeholder="例）〇〇バイオ株式会社"
          readOnly={removal}
          required
        />
      </ApplicationField>
      {removal ? null : (
        <ApplicationField
          id={id("corporateNumber")}
          label="法人番号"
          badges={<RequiredBadge />}
          guide="13桁の法人番号。国税庁 法人番号公表サイトで確認できます。"
        >
          <input
            aria-describedby={`${id("corporateNumber")}-guide`}
            className="input"
            defaultValue={defaults.corporateNumber}
            id={id("corporateNumber")}
            inputMode="numeric"
            maxLength={13}
            name={`${prefix}corporateNumber`}
            pattern="[0-9]{13}"
            placeholder="例）1234567890123"
            required
          />
        </ApplicationField>
      )}
      <ApplicationField
        id={id("accountId")}
        label="FarmilleアカウントID"
        badges={removal ? <OptionalBadge /> : <RequiredBadge />}
        guide={
          removal
            ? "Farmilleの企業会員の場合はご入力ください（照合が速くなります）。"
            : "Farmilleが発行したIDをご入力ください。"
        }
      >
        <input
          aria-describedby={`${id("accountId")}-guide`}
          className="input"
          defaultValue={defaults.accountId}
          id={id("accountId")}
          maxLength={100}
          name={`${prefix}accountId`}
          placeholder="Farmilleが発行したID"
          readOnly={fixedAccount}
          required={!removal}
        />
      </ApplicationField>
      <ApplicationField id={id("contactName")} label="担当者名" badges={requiredPrivate}>
        <input
          className="input"
          defaultValue={defaults.contactName}
          id={id("contactName")}
          maxLength={200}
          name={`${prefix}contactName`}
          placeholder="例）金子 太郎"
          readOnly={removal}
          required
        />
      </ApplicationField>
      <ApplicationField id={id("department")} label="部署名" badges={requiredPrivate}>
        <input
          className="input"
          defaultValue={defaults.department}
          id={id("department")}
          maxLength={200}
          name={`${prefix}department`}
          placeholder="例）営業部"
          required
        />
      </ApplicationField>
      <ApplicationField id={id("email")} label="担当者メールアドレス" badges={requiredPrivate}>
        <input
          className="input"
          defaultValue={defaults.email}
          id={id("email")}
          maxLength={254}
          name={`${prefix}email`}
          placeholder="tanto@example.co.jp"
          readOnly={removal}
          required
          type="email"
        />
      </ApplicationField>
      <ApplicationField id={id("phone")} label="担当者電話番号" badges={requiredPrivate}>
        <input
          className="input"
          defaultValue={defaults.phone}
          id={id("phone")}
          maxLength={50}
          name={`${prefix}phone`}
          placeholder="例）03-1234-5678"
          required
          type="tel"
        />
      </ApplicationField>
    </>
  );
}
