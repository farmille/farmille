import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/server";

export default async function OnboardingCompletePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const name = (user.user_metadata?.name as string | undefined) ?? "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Farmille
        </h1>
      </div>
      <div className="w-full max-w-md space-y-6 rounded-md border border-border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-foreground">
          登録が完了しました
        </h2>
        <p className="text-base text-foreground leading-relaxed">
          {name && <>{name} さん、</>}ご登録ありがとうございます。
          <br />
          さっそく Farmille を使い始めましょう。
        </p>
        <Button asChild className="w-full">
          <Link href="/home">はじめる</Link>
        </Button>
      </div>
    </div>
  );
}
