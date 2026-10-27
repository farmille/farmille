import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/app/account/password/ChangePasswordForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { TextLink } from "@/components/TextLink";
import { accountBackLink } from "@/lib/auth/account-back-link";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "パスワードの変更", robots: NO_INDEX_ROBOTS };

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=%2Faccount%2Fpassword");
  if (user.accountType === "admin" && user.aal !== "aal2")
    redirect("/admin/mfa?next=%2Faccount%2Fpassword");
  const seller = user.accountType === "seller";
  const back = accountBackLink(user.accountType);
  return (
    <AuthScreen
      title="パスワードの変更"
      lead="現在のパスワードを確認してから、新しいパスワードに変更します。"
    >
      <ChangePasswordForm
        loginHref={seller ? "/sellers/login" : "/login"}
        resetHref={seller ? "/sellers/password-reset" : "/password-reset"}
      />
      <TextLink href={back.href} variant="plain">
        {back.label}
      </TextLink>
    </AuthScreen>
  );
}
