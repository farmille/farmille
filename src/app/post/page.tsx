import { notFound, redirect } from "next/navigation";
import * as v from "valibot";

import { FormPageShell } from "@/components/FormPageShell";
import { getViewerAccount } from "@/components/SiteAppBar";
import { getSessionUser, requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { searchPostingMaterials, withPostingMaterialImages } from "@/server/queries/materials";

import { MaterialPicker } from "./MaterialPicker";
import { PostAccessDenied } from "./PostAccessDenied";

type PostPageProps = {
  searchParams: Promise<{ q?: string | string[]; type?: string | string[] }>;
};

export default async function PostPage({ searchParams }: PostPageProps) {
  const requested = await searchParams;
  const typeResult = v.safeParse(v.optional(v.picklist(["report", "review"])), requested.type);

  if (!typeResult.success) notFound();
  const postType = typeResult.output;
  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(
        `/login?next=${encodeURIComponent(postType === undefined ? "/post" : `/post?type=${postType}`)}`,
      );
    }

    if (session.error === "forbidden") {
      const [user, account] = await Promise.all([getSessionUser(), getViewerAccount()]);

      return <PostAccessDenied accountType={user?.accountType ?? null} account={account} />;
    }

    throw new Error(errorMessageJa[session.error]);
  }

  const query = Array.isArray(requested.q) ? "" : (requested.q?.trim() ?? "");
  const [result, account] = await Promise.all([searchPostingMaterials(query), getViewerAccount()]);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const materials = await withPostingMaterialImages(result.data);

  if (!materials.ok) {
    throw new Error(errorMessageJa[materials.error]);
  }

  return (
    <FormPageShell
      chrome="public"
      active="post"
      account={account}
      title="投稿する"
      backHref="/"
      hasFixedFooter
    >
      <MaterialPicker materials={materials.data} postType={postType} />
    </FormPageShell>
  );
}
