import "@/app/_mock/forms.css";

import { notFound, redirect } from "next/navigation";
import * as v from "valibot";

import { MockPageShell } from "@/app/_mock/MockPageShell";
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
      const user = await getSessionUser();
      return <PostAccessDenied accountType={user?.accountType ?? null} />;
    }

    throw new Error(errorMessageJa[session.error]);
  }

  const query = Array.isArray(requested.q) ? "" : (requested.q?.trim() ?? "");
  const result = await searchPostingMaterials(query);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }
  const materials = await withPostingMaterialImages(result.data);
  if (!materials.ok) {
    throw new Error(errorMessageJa[materials.error]);
  }

  return (
    <MockPageShell title="投稿する" backHref="/">
      <MaterialPicker materials={materials.data} query={query} postType={postType} />
    </MockPageShell>
  );
}
