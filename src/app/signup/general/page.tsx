import type { Metadata } from "next";

import { SitePageShell } from "@/app/_site/SitePageShell";
import { SignupForm } from "@/app/signup/SignupForm";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";

import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "一般ユーザー登録",
  description: "匿名で参加できる農業資材感想口コミの個人用アカウントを作成します。",
  robots: NO_INDEX_ROBOTS,
};

export default async function GeneralSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  // 戻るバーの題は「Farmilleをはじめる」のまま、見出しは読み上げ用に画面名を置く。
  return (
    <SitePageShell title="Farmilleをはじめる" backHref="/signup">
      <div className={css({ maxW: "content.reading", mx: "auto" })}>
        <h1 className={css({ srOnly: true })}>一般ユーザー登録</h1>
        <SignupForm next={next} />
      </div>
    </SitePageShell>
  );
}
