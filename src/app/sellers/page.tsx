import "../_mock/sellers.css";

import type { Metadata } from "next";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { createPageMetadata } from "@/lib/seo";

import { ManufacturerLanding } from "./_components/ManufacturerLanding";

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

/** 見本 S.sellersLP（メーカーの方へ）。 */
export default async function ManufacturerPage({ searchParams }: ManufacturerPageProps) {
  const { from } = await searchParams;
  const fromMe = from === "me";
  const applyHref = fromMe ? "/sellers/apply?from=me" : "/sellers/apply";

  return (
    <MockPageShell title="メーカーの方へ" backHref={fromMe ? "/me" : "/"}>
      <ManufacturerLanding applyHref={applyHref} />
    </MockPageShell>
  );
}
