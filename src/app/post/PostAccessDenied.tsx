import { PageNotice } from "@/components/PageNotice";
import Link from "next/link";

import { FormPageShell, buttonRecipe } from "@/components";
import type { AppBarAccount } from "@/components/AppBar";
import type { AccountType } from "@/server/auth";

type PostAccessDeniedProps = {
  accountType: AccountType | null;
  account: AppBarAccount;
};

export function PostAccessDenied({ accountType, account }: PostAccessDeniedProps) {
  const destination =
    accountType === "seller"
      ? { href: "/dashboard", label: "メーカーダッシュボードへ" }
      : accountType === "admin"
        ? { href: "/admin", label: "運営管理へ" }
        : null;

  return (
    <FormPageShell account={account} active="post" backHref="/" chrome="public" title="投稿する">
      <PageNotice
        description="感想口コミと実証詳細レポートの投稿は一般ユーザー専用です。メーカーや運営の作業は、それぞれの管理画面から行ってください。"
        title="一般ユーザー向けの画面です"
      >
        {destination === null ? null : (
          <Link className={buttonRecipe()} href={destination.href}>
            {destination.label}
          </Link>
        )}
      </PageNotice>
    </FormPageShell>
  );
}
