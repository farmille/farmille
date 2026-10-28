import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BottomNav } from "@/components/BottomNav";
import { LinkList } from "@/components/LinkList";
import { SiteAppBar } from "@/components/SiteAppBar";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { getOwnRegisteredContact } from "@/server/accounts/registered-address";
import { getSessionUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";

import { css } from "../../../styled-system/css";
import { contactSummary } from "./contact-summary";

export const metadata: Metadata = { title: "設定", robots: NO_INDEX_ROBOTS };

const LOGIN_PATH = "/login?next=%2Faccount";

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
  display: "flex",
  flexDirection: "column",
  gap: "8",
  px: "4",
  py: "5",
  pb: "8",
  bg: "surface.panel",
  tab: { px: "5", py: "6" },
});

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect(LOGIN_PATH);
  if (user.accountType === "admin" && user.aal !== "aal2") redirect("/admin/mfa?next=%2Faccount");
  if (user.accountType === "seller") redirect("/dashboard");

  const registered = await getOwnRegisteredContact();
  if (!registered.ok) {
    if (registered.error === "unauthorized") redirect(LOGIN_PATH);
    if (registered.error === "not_found") notFound();
    throw new Error(errorMessageJa[registered.error]);
  }

  return (
    <div className={shell}>
      <SiteAppBar chrome="public" active="me" title="設定" backHref="/me" />
      <main className={body}>
        <h1 className={css({ srOnly: true })}>設定</h1>
        <LinkList
          title="本人情報"
          description="サイトに公開されない情報です。都道府県は、プロフィールの地域として公開されます。"
          items={[
            {
              href: "/account/contact",
              label: "氏名・住所・電話",
              detail: contactSummary(registered.data),
            },
          ]}
        />
        <LinkList
          title="ログインとセキュリティ"
          items={[
            { href: "/account/password", label: "パスワードを変更" },
            { href: "/account/passkeys", label: "パスキーを管理" },
          ]}
        />
      </main>
      <BottomNav active="me" />
    </div>
  );
}
