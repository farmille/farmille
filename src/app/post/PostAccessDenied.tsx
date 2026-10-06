import { PageNotice } from "@/components/PageNotice";
import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { buttonRecipe } from "@/components";
import type { AccountType } from "@/server/auth";

export function PostAccessDenied({ accountType }: { accountType: AccountType | null }) {
  const destination =
    accountType === "seller"
      ? { href: "/dashboard", label: "メーカーダッシュボードへ" }
      : accountType === "admin"
        ? { href: "/admin", label: "運営管理へ" }
        : null;

  return (
    <MockPageShell backHref="/" title="投稿する">
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
    </MockPageShell>
  );
}
