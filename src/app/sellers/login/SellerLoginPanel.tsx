import { SellerLoginForm } from "@/app/sellers/login/SellerLoginForm";
import { PasskeyLogin } from "@/components/auth/PasskeyLogin";
import { Notice } from "@/components/form";

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
    <>
      {destinationLabel === null ? null : (
        <Notice tone="info">
          「{destinationLabel}
          」は、企業会員のログインが必要です。企業会員でない方は、先に企業会員登録をお申し込みください。
        </Notice>
      )}
      {passwordChanged ? (
        <Notice tone="success">
          パスワードを変更しました。新しいパスワードでログインしてください。
        </Notice>
      ) : null}
      <SellerLoginForm next={next} />
      <PasskeyLogin next={next ?? "/dashboard"} />
    </>
  );
}
