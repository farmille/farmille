import { PageNotice } from "@/components/PageNotice";
import { Icon } from "@/components/Icon";
import Link from "next/link";

import { BottomNav } from "@/components/BottomNav";
import { SiteAppBar } from "@/components/SiteAppBar";
import type { AccountType } from "@/server/auth";
import { css, cx } from "../../../../styled-system/css";

import { moreLinkStyle } from "./ProfileParts";

const shell = css({
  minH: "dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  flex: "1",
  w: "full",
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "8",
  bg: "surface.panel",
});

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
    <div className={shell}>
      <SiteAppBar chrome="public" active="me" title="マイページ" />
      <main className={body}>
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
      </main>
      <BottomNav active="me" />
    </div>
  );
}
