import { Field, Input } from "@/components/form";

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
  return (
    <>
      <Field label="法人名" name={`${prefix}companyName`} requirement="required">
        <Input
          defaultValue={defaults.companyName}
          maxLength={200}
          placeholder="〇〇バイオ株式会社"
        />
      </Field>
      <Field
        description="13桁の法人番号。国税庁 法人番号公表サイトで確認できます。"
        label="法人番号"
        name={`${prefix}corporateNumber`}
        requirement="required"
      >
        <Input
          defaultValue={defaults.corporateNumber}
          inputMode="numeric"
          maxLength={13}
          pattern="[0-9]{13}"
          placeholder="1234567890123"
        />
      </Field>
      <Field
        description="Farmilleが発行したIDをご入力ください。"
        label="FarmilleアカウントID"
        name={`${prefix}accountId`}
        requirement="required"
      >
        <Input
          defaultValue={defaults.accountId}
          maxLength={100}
          placeholder="Farmilleが発行したID"
          readOnly={fixedAccount}
        />
      </Field>
      <Field
        label="担当者名"
        name={`${prefix}contactName`}
        requirement="required"
        visibility="private"
      >
        <Input defaultValue={defaults.contactName} maxLength={200} placeholder="金子 太郎" />
      </Field>
      <Field
        label="部署名"
        name={`${prefix}department`}
        requirement="required"
        visibility="private"
      >
        <Input defaultValue={defaults.department} maxLength={200} placeholder="営業部" />
      </Field>
      <Field
        label="担当者メールアドレス"
        name={`${prefix}email`}
        requirement="required"
        visibility="private"
      >
        <Input
          defaultValue={defaults.email}
          maxLength={254}
          placeholder="tanto@example.co.jp"
          type="email"
        />
      </Field>
      <Field
        label="担当者電話番号"
        name={`${prefix}phone`}
        requirement="required"
        visibility="private"
      >
        <Input
          defaultValue={defaults.phone}
          maxLength={50}
          placeholder="03-1234-5678"
          type="tel"
        />
      </Field>
    </>
  );
}
