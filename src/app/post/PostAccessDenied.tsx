import Link from "next/link";

import { FormPageShell, SurfaceCard, buttonRecipe } from "@/components";
import type { AccountType } from "@/server/auth";

export function PostAccessDenied({ accountType }: { accountType: AccountType | null }) {
  const destination =
    accountType === "seller"
      ? { href: "/dashboard", label: "メーカーダッシュボードへ" }
      : accountType === "admin"
        ? { href: "/admin", label: "運営管理へ" }
        : null;

  return (
    <FormPageShell active="post" backHref="/" chrome="public" title="投稿する">
      <SurfaceCard
        description="レビューと使用レポートの投稿は一般ユーザー専用です。メーカーや運営の作業は、それぞれの管理画面から行ってください。"
        title="一般ユーザー向けの画面です"
      >
        {destination === null ? null : (
          <Link className={buttonRecipe()} href={destination.href}>
            {destination.label}
          </Link>
        )}
      </SurfaceCard>
    </FormPageShell>
  );
}
