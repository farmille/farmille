import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { registrationHandleCheckAction } from "../actions";
import { SignupForm } from "../SignupForm";
import { RegistrationTerms } from "../RegistrationTerms";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";
import { getRegistrationIdentity } from "@/server/accounts/general";

export const metadata: Metadata = { title: "登録情報の入力", robots: NO_INDEX_ROBOTS };

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  const identity = await getRegistrationIdentity();
  if (!identity.ok) {
    if (identity.error === "internal")
      throw new Error("メールアドレスの確認状態を取得できませんでした。");
    redirect(`/signup/general?error=${identity.error}`);
  }
  return (
    <AuthScreen lead="確認済みのメールアドレスで登録します。" title="登録情報の入力">
      <SignupForm
        checkHandle={registrationHandleCheckAction}
        email={identity.data.email}
        next={next}
        termsContent={<RegistrationTerms />}
      />
    </AuthScreen>
  );
}
