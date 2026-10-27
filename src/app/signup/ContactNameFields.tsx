import { Fieldset, Input } from "@/components/form";

import { css } from "../../../styled-system/css";

const nameRowStyle = css({ display: "flex", gap: "2" });

const namePartStyle = css({ flex: "1" });

/** 非公開の本名と電話番号。会員登録と登録情報の変更で同じ欄を使う。 */
export function ContactNameFields({ values }: { values: Record<string, string> }) {
  return (
    <>
      <Fieldset legend="本名" requirement="required" visibility="private">
        <div className={nameRowStyle}>
          <Input
            fieldClassName={namePartStyle}
            hideLabel
            label="本名（姓）"
            name="familyName"
            autoComplete="family-name"
            defaultValue={values.familyName}
            maxLength={80}
            placeholder="姓"
          />
          <Input
            fieldClassName={namePartStyle}
            hideLabel
            label="本名（名）"
            name="givenName"
            autoComplete="given-name"
            defaultValue={values.givenName}
            maxLength={80}
            placeholder="名"
          />
        </div>
      </Fieldset>

      <Input
        description="確認が必要な場合の連絡に使用します。公開されません。"
        label="電話番号"
        name="phone"
        requirement="optional"
        visibility="private"
        autoComplete="tel"
        defaultValue={values.phone}
        maxLength={20}
        placeholder="090-1234-5678"
        type="tel"
      />
    </>
  );
}
