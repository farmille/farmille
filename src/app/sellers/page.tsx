import { SiteAppBar } from "@/components/SiteAppBar";
import type { Metadata } from "next";

import { HomeFooter } from "@/app/_components/HomeFooter";

import { BottomNav } from "@/components/BottomNav";
import { createPageMetadata } from "@/lib/seo";

import { css } from "../../../styled-system/css";
import { ManufacturerLanding } from "./_components/ManufacturerLanding";

const shell = css({
  minH: "100dvh",
  display: "flex",
  flexDirection: "column",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
});

const main = css({
  flex: "1",
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  pt: "4",
  pb: "8",
  tab: { px: "5", pb: "10" },
});

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "企業様向け利用ガイド",
    description:
      "メーカーの企業会員登録、資材掲載・編集、オーナー権限の移行の申請方法と必要資料、終売・非表示のご依頼先をご案内します。",
    path: "/sellers",
  });
}

type ManufacturerPageProps = {
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function ManufacturerPage({ searchParams }: ManufacturerPageProps) {
  const { from } = await searchParams;
  const fromMe = from === "me";
  const applyHref = fromMe ? "/sellers/apply?from=me" : "/sellers/apply";

  return (
    <div className={shell}>
      <SiteAppBar
        chrome="public"
        active="home"
        title="メーカーの方へ"
        backHref={fromMe ? "/me" : "/"}
      />
      <main className={main}>
        <ManufacturerLanding applyHref={applyHref} />
        <HomeFooter />
      </main>
      <BottomNav active="home" />
    </div>
  );
}
