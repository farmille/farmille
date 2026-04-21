import { redirect } from "next/navigation";
import { getRole, getUser } from "@/lib/auth/server";
import { isMakerRole, isReviewerRole } from "@/lib/auth/roles";
import { signOut } from "@/lib/auth/actions";

const roleLabel: Record<string, string> = {
  farmer: "農家",
  ja_staff: "JA 職員",
  researcher: "研究者",
  maker: "資材メーカー",
};

export default async function HomePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getRole();
  if (!role || role === "unassigned") {
    redirect("/onboarding");
  }

  const name = (user.user_metadata?.name as string | undefined) ?? "";
  const label = roleLabel[role] ?? role;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Farmille
          </h1>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              ログアウト
            </button>
          </form>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">
            ようこそ、{name || "Farmille"} さん
          </h2>
          <p className="mt-2 text-base text-zinc-700">
            現在のロール: <span className="font-medium">{label}</span>
          </p>

          {isReviewerRole(role) && (
            <p className="mt-6 text-base text-zinc-700 leading-relaxed">
              BS資材のレビューを投稿して、他の農家の参考になる体験を共有しましょう。
              (レビュー投稿機能は近日公開予定)
            </p>
          )}

          {isMakerRole(role) && (
            <p className="mt-6 text-base text-zinc-700 leading-relaxed">
              自社のBS資材を登録し、農家からのレビューを受け取りましょう。
              (資材登録機能は近日公開予定)
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
