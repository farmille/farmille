import { PageNotice } from "@/components/PageNotice";
import { Icon } from "@/components/Icon";
import Link from "next/link";

import { AppBar } from "@/components";
import { BottomNav } from "@/components/BottomNav";
import type { AccountType } from "@/server/auth";
import { css } from "../../../../styled-system/css";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const body = css({
  flex: "1",
  w: "100%",
  maxW: "content.form",
  mx: "auto",
  px: "4",
  py: "8",
  bg: "surface.panel",
});

const linkStyle = css({
  display: "inline-flex",
  mt: "4",
  color: "primary.700",
  fontWeight: "bold",
  textDecoration: "none",
});

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
      <AppBar chrome="public" active="me" title="マイページ" />
      <main className={body}>
        <PageNotice
          title="一般ユーザー向けの画面です"
          description="マイページ・プロフィール編集・お気に入りは一般ユーザー専用です。メーカーや運営の作業は、それぞれのダッシュボードから行ってください。"
        >
          {destination !== null ? (
            <Link href={destination.href} className={linkStyle}>
              {destination.label} <Icon name="arrow_forward" size="sm" />
            </Link>
          ) : null}
        </PageNotice>
      </main>
      <BottomNav active="me" />
    </div>
  );
}
