import type { Metadata } from "next";

import { AppBar } from "@/components";
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
  py: "4",
  pb: "8",
  tab: { px: "5", py: "6", pb: "10" },
});

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "メーカーの方へ",
    description:
      "Farmilleのメーカーアカウントで、自社の農業資材情報、根拠資料、記事を管理できます。",
    path: "/sellers",
  });
}

type ManufacturerPageProps = {
  searchParams: Promise<{ from?: string | string[] }>;
};

export default async function ManufacturerPage({ searchParams }: ManufacturerPageProps) {
  const { from } = await searchParams;
  const applyHref = from === "me" ? "/sellers/apply?from=me" : "/sellers/apply";

  return (
    <div className={shell}>
      <AppBar chrome="public" active="home" variant="home" />
      <main className={main}>
        <ManufacturerLanding applyHref={applyHref} />
      </main>
      <BottomNav active="home" />
    </div>
  );
}
