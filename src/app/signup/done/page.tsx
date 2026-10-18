import type { Metadata } from "next";
import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { FormActions } from "@/components/form";
import { TextLink } from "@/components/TextLink";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { safeNextPath } from "@/lib/auth/safe-next";

import { OnboardingArm } from "./OnboardingArm";

import { css } from "../../../../styled-system/css";

const leadStyle = css({
  textStyle: "supporting",
  color: "text.subtle",
  mb: "4.5",
  textAlign: "center",
});

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
    <AuthScreen title="登録が完了しました">
      <OnboardingArm />
      <p className={leadStyle}>会員登録が完了しました。ログインしてご利用ください。</p>
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
