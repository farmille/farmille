import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { WithdrawalNotes } from "@/app/account/withdraw/WithdrawalNotes";
import { WithdrawForm } from "@/app/account/withdraw/WithdrawForm";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = { title: "退会", robots: NO_INDEX_ROBOTS };

export default async function WithdrawPage() {
  const user = await getSessionUser();

  if (!user) redirect("/login?next=%2Faccount%2Fwithdraw");

  // 企業会員と運営は、この画面から退会できない。
  if (user.accountType !== "general") notFound();

  return (
    <AuthScreen
      title="退会"
      lead="退会すると、次のようになります。内容を確かめてから進んでください。"
    >
      <WithdrawalNotes />
      <WithdrawForm />
    </AuthScreen>
  );
}
