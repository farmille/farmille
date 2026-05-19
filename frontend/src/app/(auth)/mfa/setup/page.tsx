import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TotpEnrollForm } from "./_components/totp-enroll-form";

export const metadata: Metadata = {
  title: "2段階認証の設定",
};

function safeNext(next: string | undefined): string {
  if (typeof next !== "string") return "/admin";
  if (!next.startsWith("/") || next.startsWith("//")) return "/admin";
  return next;
}

export default async function MfaSetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const next = safeNext(params.next);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/mfa/setup")}`);
  }

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") {
    redirect(next);
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedTotp = factors?.totp.find((f) => f.status === "verified");
  if (verifiedTotp) {
    redirect(`/mfa/challenge?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900">
        2段階認証の設定
      </h2>
      <p className="text-sm text-zinc-600 leading-relaxed">
        管理者アカウントは TOTP 2 段階認証が必須です。お使いの認証アプリ
        （Google Authenticator / 1Password / Authy 等）で QR コードを読み取り、
        表示された 6 桁のコードを入力してください。
      </p>
      <TotpEnrollForm next={next} />
    </div>
  );
}
