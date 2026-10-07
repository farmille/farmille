import { FormNotice } from "@/app/_mock/FormParts";
import { SellerLoginForm } from "@/app/sellers/login/SellerLoginForm";
import { PasskeyLogin } from "@/components/auth/PasskeyLogin";

import { css, cx } from "../../../../styled-system/css";
import { sellerLeadStyle } from "../_components/form-styles";

export function SellerLoginPanel({
  destinationLabel,
  next,
  passwordChanged,
}: {
  destinationLabel: string | null;
  next: string | null;
  passwordChanged: boolean;
}) {
  return (
    <div className={css({ maxW: "auth", mx: "auto" })}>
      {destinationLabel === null ? null : (
        <div
          className={css({
            mb: "4",
            bg: "accent.warnSoft",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "accent.warn/25",
            borderRadius: "input",
            px: "3.5",
            py: "2.5",
            fontSize: "sm",
            lineHeight: "prose",
            color: "text.muted",
          })}
          role="status"
        >
          「{destinationLabel}
          」は、企業会員のログインが必要です。企業会員でない方は、先に企業会員登録をお申し込みください。
        </div>
      )}
      {passwordChanged ? (
        <FormNotice tone="info">
          パスワードを変更しました。新しいパスワードでログインしてください。
        </FormNotice>
      ) : null}
      <h1 className={css({ fontSize: "xl" })}>メーカーログイン</h1>
      <p className={cx(sellerLeadStyle, css({ mt: "1.5" }))}>
        企業会員のログインIDでサインインします。
      </p>
      <SellerLoginForm next={next} />
      <PasskeyLogin next={next ?? "/dashboard"} />
    </div>
  );
}
