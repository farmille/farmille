import type { Metadata } from "next";

import { AppBar } from "@/components";
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
  pb: "8",
  tab: { pb: "10" },
});

const footer = css({ px: "4", tab: { px: "5" } });

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "企業様向け利用ガイド",
    description:
      "メーカーの企業会員登録、資材掲載・編集、オーナー権限の移行、終売・非表示の申請方法と必要資料をご案内します。",
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
      <AppBar
        chrome="public"
        active="home"
        title="メーカーの方へ"
        backHref={fromMe ? "/me" : "/"}
      />
      <main className={main}>
        <ManufacturerLanding applyHref={applyHref} />
        <div className={footer}>
          <HomeFooter />
        </div>
      </main>
      <BottomNav active="home" />
    </div>
  );
}
