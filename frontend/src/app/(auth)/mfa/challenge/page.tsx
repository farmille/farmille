import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";
import { TotpChallengeForm } from "./_components/totp-challenge-form";

export const metadata: Metadata = {
  title: "2段階認証",
};

export default async function MfaChallengePage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = (await searchParams) ?? {};
  // open-redirect 対策は共通 safeNextPath に集約 (2026-06-15)。不正/未指定は /admin。
  const next = safeNextPath(params.next) ?? "/admin";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/mfa/challenge")}`);
  }

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") {
    redirect(next);
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = factors?.totp.find((f) => f.status === "verified");
  if (!verifiedTotp) {
    redirect(`/mfa/setup?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900">2段階認証</h2>
      <p className="text-sm text-zinc-600 leading-relaxed">
        認証アプリに表示されている 6 桁のコードを入力してください。
      </p>
      <TotpChallengeForm factorId={verifiedTotp.id} next={next} />
    </div>
  );
}
