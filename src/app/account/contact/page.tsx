import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BottomNav } from "@/components/BottomNav";
import { Notice } from "@/components/form";
import { SiteAppBar } from "@/components/SiteAppBar";
import { TextLink } from "@/components/TextLink";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { getOwnRegisteredContact } from "@/server/accounts/registered-address";
import { getSessionUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";

import { css } from "../../../../styled-system/css";
import { RegisteredContactForm } from "./RegisteredContactForm";

export const metadata: Metadata = { title: "本人情報", robots: NO_INDEX_ROBOTS };

const LOGIN_PATH = "/login?next=%2Faccount%2Fcontact";

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
  py: "4",
  pb: "8",
  bg: "surface.panel",
  tab: { px: "5", py: "5" },
});

const sectionHeading = css({ mt: "6", mb: "3", textStyle: "title" });

const backLink = css({ mt: "6" });

function formatPostalCode(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export default async function AccountContactPage() {
  const user = await getSessionUser();
  if (!user) redirect(LOGIN_PATH);
  if (user.accountType === "admin" && user.aal !== "aal2")
    redirect("/admin/mfa?next=%2Faccount%2Fcontact");
  if (user.accountType === "seller") redirect("/dashboard");

  const registered = await getOwnRegisteredContact();
  if (!registered.ok) {
    if (registered.error === "unauthorized") redirect(LOGIN_PATH);
    if (registered.error === "not_found") notFound();
    throw new Error(errorMessageJa[registered.error]);
  }
  const { prefectureCode, contact } = registered.data;
  const saved = {
    familyName: contact?.family_name ?? "",
    givenName: contact?.given_name ?? "",
    phone: contact?.phone ?? "",
    postalCode: contact === null ? "" : formatPostalCode(contact.postal_code),
    prefectureCode: prefectureCode === null ? "" : String(prefectureCode),
    cityStreet: contact?.city_street ?? "",
    buildingName: contact?.building_name ?? "",
  };

  return (
    <div className={shell}>
      <SiteAppBar chrome="public" active="me" title="本人情報" backHref="/account" />
      <main className={body}>
        <h1 className={css({ srOnly: true })}>本人情報</h1>
        <Notice tone="info">
          この画面の情報はサイトに公開されません。都道府県は、プロフィールの地域として公開されます。
        </Notice>
        <section aria-labelledby="account-contact-heading">
          <h2 className={sectionHeading} id="account-contact-heading">
            氏名・住所・電話
          </h2>
          <RegisteredContactForm saved={saved} />
        </section>
        <div className={backLink}>
          <TextLink href="/account" variant="plain">
            設定に戻る
          </TextLink>
        </div>
      </main>
      <BottomNav active="me" />
    </div>
  );
}
