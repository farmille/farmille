import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RegisteredDetailsForm } from "@/app/account/details/RegisteredDetailsForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { TextLink } from "@/components/TextLink";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { getOwnRegisteredDetails } from "@/server/accounts/general";
import { errorMessageJa } from "@/server/errors";

export const metadata: Metadata = { title: "登録情報の確認・変更", robots: NO_INDEX_ROBOTS };

export default async function RegisteredDetailsPage() {
  const details = await getOwnRegisteredDetails();

  if (!details.ok) {
    if (details.error === "unauthorized") redirect("/login?next=%2Faccount%2Fdetails");

    // 企業会員と運営には、登録情報の画面が無い。
    if (details.error === "forbidden" || details.error === "not_found") notFound();
    throw new Error(errorMessageJa[details.error]);
  }

  return (
    <AuthScreen
      title="登録情報の確認・変更"
      lead="会員登録で入力した情報を確認し、変更できます。公開されるのは都道府県だけです。"
    >
      <RegisteredDetailsForm details={details.data} />
      <TextLink href="/me" variant="plain">
        マイページに戻る
      </TextLink>
    </AuthScreen>
  );
}
