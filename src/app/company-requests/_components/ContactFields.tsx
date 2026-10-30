import { Input } from "@/components/form";

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
  values,
  onChange,
  fixedAccount = false,
}: {
  prefix?: string;
  values: ContactDefaults;
  onChange: (name: keyof ContactDefaults, value: string) => void;
  fixedAccount?: boolean;
}) {
  return (
    <>
      <Input
        label="法人名"
        name={`${prefix}companyName`}
        requirement="required"
        value={values.companyName}
        onChange={(event) => onChange("companyName", event.target.value)}
        maxLength={200}
        placeholder="〇〇バイオ株式会社"
      />
      <Input
        description="13桁の法人番号。国税庁 法人番号公表サイトで確認できます。"
        label="法人番号"
        name={`${prefix}corporateNumber`}
        requirement="required"
        value={values.corporateNumber}
        onChange={(event) => onChange("corporateNumber", event.target.value)}
        inputMode="numeric"
        maxLength={13}
        pattern="[0-9]{13}"
        placeholder="1234567890123"
      />
      <Input
        description="Farmilleが発行したIDをご入力ください。"
        label="Farmille企業会員ID"
        name={`${prefix}accountId`}
        requirement="required"
        value={values.accountId}
        onChange={(event) => onChange("accountId", event.target.value)}
        maxLength={100}
        placeholder="Farmilleが発行したID"
        readOnly={fixedAccount}
      />
      <Input
        label="担当者名"
        name={`${prefix}contactName`}
        requirement="required"
        visibility="private"
        value={values.contactName}
        onChange={(event) => onChange("contactName", event.target.value)}
        maxLength={200}
        placeholder="金子 太郎"
      />
      <Input
        label="部署名"
        name={`${prefix}department`}
        requirement="required"
        visibility="private"
        value={values.department}
        onChange={(event) => onChange("department", event.target.value)}
        maxLength={200}
        placeholder="営業部"
      />
      <Input
        label="担当者メールアドレス"
        name={`${prefix}email`}
        requirement="required"
        visibility="private"
        value={values.email}
        onChange={(event) => onChange("email", event.target.value)}
        maxLength={254}
        placeholder="tanto@example.co.jp"
        type="email"
      />
      <Input
        label="担当者電話番号"
        name={`${prefix}phone`}
        requirement="required"
        visibility="private"
        value={values.phone}
        onChange={(event) => onChange("phone", event.target.value)}
        maxLength={50}
        placeholder="03-1234-5678"
        type="tel"
      />
    </>
  );
}
