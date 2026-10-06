import { Input } from "@/components";
import { css } from "../../../../styled-system/css";

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
export const applicationStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
  fontSize: "md",
  lineHeight: "relaxed",
});
export const applicationField = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  fontSize: "md",
});
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
  return (
    <div className={applicationStack}>
      <label className={applicationField}>
        法人名（必須）
        <Input
          name={`${prefix}companyName`}
          defaultValue={defaults.companyName}
          required
          maxLength={200}
          readOnly={removal}
        />
      </label>
      {!removal && (
        <label className={applicationField}>
          法人番号（必須・13桁）
          <Input
            name={`${prefix}corporateNumber`}
            defaultValue={defaults.corporateNumber}
            pattern="[0-9]{13}"
            inputMode="numeric"
            required
            maxLength={13}
          />
          <span>国税庁 法人番号公表サイトで確認できます。</span>
        </label>
      )}
      <label className={applicationField}>
        FarmilleアカウントID（{removal ? "任意" : "必須"}）
        <Input
          name={`${prefix}accountId`}
          defaultValue={defaults.accountId}
          required={!removal}
          readOnly={fixedAccount}
          maxLength={100}
        />
        <span>
          {removal ? "企業会員の場合はご入力ください。" : "Farmilleが発行したIDをご入力ください。"}
        </span>
      </label>
      <label className={applicationField}>
        担当者名（必須・非公開）
        <Input
          name={`${prefix}contactName`}
          defaultValue={defaults.contactName}
          required
          readOnly={removal}
          maxLength={200}
        />
      </label>
      <label className={applicationField}>
        部署名（必須・非公開）
        <Input
          name={`${prefix}department`}
          defaultValue={defaults.department}
          required
          maxLength={200}
        />
      </label>
      <label className={applicationField}>
        担当者メールアドレス（必須・非公開）
        <Input
          name={`${prefix}email`}
          defaultValue={defaults.email}
          type="email"
          required
          readOnly={removal}
          maxLength={254}
        />
      </label>
      <label className={applicationField}>
        担当者電話番号（必須・非公開）
        <Input
          name={`${prefix}phone`}
          defaultValue={defaults.phone}
          type="tel"
          required
          maxLength={50}
        />
      </label>
    </div>
  );
}
