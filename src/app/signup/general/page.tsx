import "../../_mock/forms.css";

import type { Metadata } from "next";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { SignupForm } from "@/app/signup/SignupForm";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";

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
  // 見本 S.signup。戻るバーの題は見本どおり「Farmilleをはじめる」、見出しは読み上げ用に画面名を置く。
  return (
    <MockPageShell title="Farmilleをはじめる" backHref="/signup">
      <div className="fm-narrow">
        <h1 className="sr-only">一般ユーザー登録</h1>
        <SignupForm next={next} />
      </div>
    </MockPageShell>
  );
}
