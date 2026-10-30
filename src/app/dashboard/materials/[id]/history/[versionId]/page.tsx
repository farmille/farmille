import { notFound, redirect } from "next/navigation";
import * as v from "valibot";
import { FormPageShell } from "@/components";
import { MaterialPageContent } from "@/components/materials/MaterialPageContent";
import { requireSeller } from "@/server/auth";
import { getMaterialPageVersion } from "@/server/material-page-editor";

export default async function MaterialVersionPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;

  if (!v.is(v.pipe(v.string(), v.uuid()), versionId)) notFound();
  const session = await requireSeller();

  if (!session.ok) redirect("/sellers/login");
  const saved = await getMaterialPageVersion(versionId);

  if (
    !saved ||
    saved.version.material_id !== id ||
    saved.version.seller_id !== session.data.sellerId
  )
    notFound();

  return (
    <FormPageShell chrome="seller" backHref={`/dashboard/materials/${id}`} title="保存した原稿">
      <MaterialPageContent content={saved.content} imageUrl={saved.imageUrl} />
    </FormPageShell>
  );
}
