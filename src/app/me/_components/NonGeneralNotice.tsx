import { PageNotice } from "@/components/PageNotice";
import { Icon } from "@/components/Icon";
import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import type { AccountType } from "@/server/auth";
import { css, cx } from "../../../../styled-system/css";

import { moreLinkStyle } from "./ProfileParts";

const destinationLink = css({ display: "inline-flex", alignItems: "center", gap: "1", mt: "4" });

type NonGeneralNoticeProps = {
  accountType: AccountType | null;
};

/** メーカー・運営が /me に来たときの誘導。 */
export function NonGeneralNotice({ accountType }: NonGeneralNoticeProps) {
  const destination =
    accountType === "seller"
      ? { href: "/dashboard", label: "メーカーダッシュボードへ" }
      : accountType === "admin"
        ? { href: "/admin/sellers", label: "運営管理へ" }
        : null;

  return (
    <MockPageShell title="マイページ" backHref="/" active="me">
      <PageNotice
        title="一般ユーザー向けの画面です"
        description="マイページ・プロフィール編集・お気に入りは一般ユーザー専用です。メーカーや運営の作業は、それぞれのダッシュボードから行ってください。"
      >
        {destination !== null ? (
          <Link href={destination.href} className={cx(moreLinkStyle, destinationLink)}>
            {destination.label} <Icon name="arrow_forward" size="sm" />
          </Link>
        ) : null}
      </PageNotice>
    </MockPageShell>
  );
}
