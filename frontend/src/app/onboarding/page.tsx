import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { signOut } from "@/lib/auth/actions";
import { RoleRecoveryForm } from "./role-recovery-form";

type PageProps = {
  searchParams?: Promise<{ recover?: string }>;
};

export default async function OnboardingPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getRole();

  // 通常フロー（signup → callback → /onboarding/{role} 直行）では
  // 本ページに到達しない。intended_role が読み取れなかった場合や
  // complete-signup 失敗時の recover=1 フォールバック用に残す。
  if (role === "farmer") {
    redirect("/onboarding/farmer");
  }
  if (role === "maker") {
    redirect("/onboarding/maker");
  }
  if (role === "ja_staff" || role === "researcher") {
    redirect(landingPathForRole(role));
  }

  const params = (await searchParams) ?? {};
  const recovering = params.recover === "1";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Farmille
        </h1>
      </div>
      <div className="w-full max-w-md space-y-6 rounded-md border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            登録を完了させてください
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            属性を選択して、登録を完了してください。
          </p>
        </div>

        <RoleRecoveryForm
          initialError={
            recovering
              ? "登録処理が完了していません。属性を選び直してください。"
              : undefined
          }
        />

        <form action={signOut} className="pt-2">
          <Button type="submit" variant="outline" className="w-full">
            ログアウト
          </Button>
        </form>
      </div>
    </div>
  );
}
