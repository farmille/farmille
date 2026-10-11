import type { Metadata } from "next";
import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { FormActions, Notice } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";

export const metadata: Metadata = {
  title: "登録完了",
  robots: NO_INDEX_ROBOTS,
};

export default async function SignupDonePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: requestedNext } = await searchParams;
  const next = safeNextPath(requestedNext);

  return (
    <AuthScreen
      lead="会員登録が完了しました。ログインしてご利用ください。"
      title="登録が完了しました"
    >
      <Notice tone="neutral">
        アイコン画像・一言プロフィール・主な作目は、マイページからあとで設定できます。
      </Notice>

      <FormActions>
        <Link
          className={buttonRecipe({ variant: "primary", size: "md" })}
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
        >
          ログインする
        </Link>
        <TextLink href="/" variant="plain">
          ホームへ
        </TextLink>
      </FormActions>
    </AuthScreen>
  );
}
