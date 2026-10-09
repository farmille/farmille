import { Field } from "@/components/auth/Fields";
import { Input } from "@/components/Input";

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

export function ContactFields({
  prefix = "",
  defaults,
  fixedAccount = false,
}: {
  prefix?: string;
  defaults: ContactDefaults;
  fixedAccount?: boolean;
}) {
  const id = (name: string) => `${prefix.replace(/\W/g, "-")}${name}`;
  return (
    <>
      <Field htmlFor={id("companyName")} label="法人名" requirement="required">
        <Input
          defaultValue={defaults.companyName}
          id={id("companyName")}
          maxLength={200}
          name={`${prefix}companyName`}
          placeholder="例）〇〇バイオ株式会社"
          required
        />
      </Field>
      <Field
        guide="13桁の法人番号。国税庁 法人番号公表サイトで確認できます。"
        htmlFor={id("corporateNumber")}
        label="法人番号"
        requirement="required"
      >
        <Input
          defaultValue={defaults.corporateNumber}
          id={id("corporateNumber")}
          inputMode="numeric"
          maxLength={13}
          name={`${prefix}corporateNumber`}
          pattern="[0-9]{13}"
          placeholder="例）1234567890123"
          required
        />
      </Field>
      <Field
        guide="Farmilleが発行したIDをご入力ください。"
        htmlFor={id("accountId")}
        label="FarmilleアカウントID"
        requirement="required"
      >
        <Input
          defaultValue={defaults.accountId}
          id={id("accountId")}
          maxLength={100}
          name={`${prefix}accountId`}
          placeholder="Farmilleが発行したID"
          readOnly={fixedAccount}
          required
        />
      </Field>
      <Field
        htmlFor={id("contactName")}
        label="担当者名"
        requirement="required"
        visibility="private"
      >
        <Input
          defaultValue={defaults.contactName}
          id={id("contactName")}
          maxLength={200}
          name={`${prefix}contactName`}
          placeholder="例）金子 太郎"
          required
        />
      </Field>
      <Field htmlFor={id("department")} label="部署名" requirement="required" visibility="private">
        <Input
          defaultValue={defaults.department}
          id={id("department")}
          maxLength={200}
          name={`${prefix}department`}
          placeholder="例）営業部"
          required
        />
      </Field>
      <Field
        htmlFor={id("email")}
        label="担当者メールアドレス"
        requirement="required"
        visibility="private"
      >
        <Input
          defaultValue={defaults.email}
          id={id("email")}
          maxLength={254}
          name={`${prefix}email`}
          placeholder="tanto@example.co.jp"
          required
          type="email"
        />
      </Field>
      <Field
        htmlFor={id("phone")}
        label="担当者電話番号"
        requirement="required"
        visibility="private"
      >
        <Input
          defaultValue={defaults.phone}
          id={id("phone")}
          maxLength={50}
          name={`${prefix}phone`}
          placeholder="例）03-1234-5678"
          required
          type="tel"
        />
      </Field>
    </>
  );
}
