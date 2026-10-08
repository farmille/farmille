import { FormNotice } from "@/app/_site/FormParts";
import { SellerLoginForm } from "@/app/sellers/login/SellerLoginForm";
import { PasskeyLogin } from "@/components/auth/PasskeyLogin";

import { css } from "../../../../styled-system/css";

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
      <SellerLoginForm next={next} />
      <PasskeyLogin next={next ?? "/dashboard"} />
    </div>
  );
}
