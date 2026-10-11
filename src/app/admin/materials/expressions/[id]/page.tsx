import { notFound } from "next/navigation";
import * as v from "valibot";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { adminBodyStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { TextLink } from "@/components";
import { MaterialPageContent } from "@/components/materials/MaterialPageContent";
import { getMaterialPageVersion } from "@/server/material-page-editor";
import { BS_GUIDELINE_TITLE, BS_GUIDELINE_URL } from "@/lib/manufacturer-policy";
import { ExpressionReviewForm } from "../ExpressionReviewForm";

export default async function ExpressionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/admin/materials/expressions/${id}`);
  if (!v.is(v.pipe(v.string(), v.uuid()), id)) notFound();
  const saved = await getMaterialPageVersion(id);
  if (!saved) notFound();
  return (
    <AdminShell title="製品情報の表現確認" backHref="/admin/materials/expressions">
      <p className={adminBodyStyle}>
        <a href={BS_GUIDELINE_URL} target="_blank" rel="noreferrer">
          {BS_GUIDELINE_TITLE}
        </a>
        を参照し、表示や説明に問題がないか確認してください。内容の代筆や整理は行いません。
      </p>
      <TextLink className={adminBodyStyle} href={`/materials/${saved.version.material_id}`}>
        現在の公開ページと比較する
      </TextLink>
      <MaterialPageContent content={saved.content} imageUrl={saved.imageUrl} />
      {saved.version.status === "pending" ? (
        <ExpressionReviewForm versionId={id} />
      ) : (
        <p className={adminBodyStyle}>この原稿の表現確認は終了しています。</p>
      )}
    </AdminShell>
  );
}
