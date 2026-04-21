import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { signOut } from "@/lib/auth/actions";
import { RoleRecoveryForm } from "./role-recovery-form";

const roleLabel: Record<string, string> = {
  farmer: "農家",
  ja_staff: "JA 職員",
  researcher: "研究者",
  maker: "資材メーカー",
};

type PageProps = {
  searchParams?: Promise<{ recover?: string }>;
};

export default async function OnboardingPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getRole();
  const params = (await searchParams) ?? {};
  const recovering = params.recover === "1";
  const name = (user.user_metadata?.name as string | undefined) ?? "";

  if (role && role !== "unassigned") {
    const label = roleLabel[role] ?? role;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Farmille
          </h1>
        </div>
        <div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">
            ようこそ、Farmille へ
          </h2>
          <p className="text-base text-zinc-700 leading-relaxed">
            {name && <>{name} さん、</>}登録が完了しました。
            <br />
            現在のロール: <span className="font-medium">{label}</span>
          </p>
          <a
            href="/home"
            className="block w-full rounded bg-zinc-900 py-2.5 text-center text-base font-medium text-white hover:bg-zinc-800"
          >
            はじめる
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Farmille
        </h1>
      </div>
      <div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-zinc-900">
            登録を完了させてください
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
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
          <button
            type="submit"
            className="w-full rounded border border-zinc-300 bg-white py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}
