import { redirect } from "next/navigation";

import { FormPageShell } from "@/components";
import { getSessionUser, requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { searchPostingMaterials } from "@/server/queries/materials";

import { MaterialPicker } from "./MaterialPicker";
import { PostAccessDenied } from "./PostAccessDenied";

type PostPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function PostPage({ searchParams }: PostPageProps) {
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect("/login?next=%2Fpost");
    }

    if (session.error === "forbidden") {
      const user = await getSessionUser();
      return <PostAccessDenied accountType={user?.accountType ?? null} />;
    }

    throw new Error(errorMessageJa[session.error]);
  }

  const requested = await searchParams;
  const query = Array.isArray(requested.q) ? "" : (requested.q?.trim() ?? "");
  const result = await searchPostingMaterials(query);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  return (
    <FormPageShell chrome="public" active="post" title="投稿する" backHref="/" hasFixedFooter>
      <MaterialPicker materials={result.data} query={query} />
    </FormPageShell>
  );
}
