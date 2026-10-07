import type { ReactNode } from "react";

import {
  fieldLabelStyle,
  fieldStyle,
  formalControlRecipe,
  formalGuideRecipe,
} from "./formal-styles";
import { OptionalMark, PrivateNote, RequiredMark } from "./FormalMarks";

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
    <div className={fieldStyle}>
      <label className={fieldLabelStyle} htmlFor={id}>
        {label} {badges}
      </label>
      {children}
      {guide === undefined ? null : (
        <div
          className={formalGuideRecipe({ tone: "hint", placement: "trailing" })}
          id={`${id}-guide`}
        >
          {guide}
        </div>
      )}
    </div>
  );
}

const requiredPrivate = (
  <>
    <RequiredMark /> <PrivateNote />
  </>
);

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
      <ApplicationField id={id("companyName")} label="法人名" badges={<RequiredMark />}>
        <input
          className={formalControlRecipe()}
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
          badges={<RequiredMark />}
          guide="13桁の法人番号。国税庁 法人番号公表サイトで確認できます。"
        >
          <input
            aria-describedby={`${id("corporateNumber")}-guide`}
            className={formalControlRecipe()}
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
        badges={removal ? <OptionalMark /> : <RequiredMark />}
        guide={
          removal
            ? "Farmilleの企業会員の場合はご入力ください（照合が速くなります）。"
            : "Farmilleが発行したIDをご入力ください。"
        }
      >
        <input
          aria-describedby={`${id("accountId")}-guide`}
          className={formalControlRecipe()}
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
          className={formalControlRecipe()}
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
          className={formalControlRecipe()}
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
          className={formalControlRecipe()}
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
          className={formalControlRecipe()}
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
