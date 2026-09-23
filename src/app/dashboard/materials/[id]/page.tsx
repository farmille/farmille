import { notFound, redirect } from "next/navigation";
import * as v from "valibot";

import { MaterialPageEditor } from "@/app/dashboard/materials/_components/MaterialPageEditor";
import { HideMaterialPageForm } from "@/app/dashboard/materials/_components/HideMaterialPageForm";
import {
  DataList,
  EmptyState,
  FormPageShell,
  SurfaceCard,
  TextLink,
  formatDateJa,
} from "@/components";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { MATERIAL_PAGE_STATUS_LABELS } from "@/lib/material-page-editor";
import { requireSeller } from "@/server/auth";
import { getMaterialEditor } from "@/server/material-page-editor";
import { listMaterialPageAudits } from "@/server/material-page-audits";
import { SellerAccessDenied } from "../../_components/AccessDenied";

export default async function SellerMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!v.is(v.pipe(v.string(), v.uuid()), id)) notFound();
  const session = await requireSeller();
  if (!session.ok) {
    if (session.error === "unauthorized")
      redirect(`/sellers/login?next=${encodeURIComponent(`/dashboard/materials/${id}`)}`);
    return <SellerAccessDenied backHref="/dashboard/materials" />;
  }
  const editor = await getMaterialEditor(id, session.data.sellerId);
  const audits = editor ? await listMaterialPageAudits(id) : [];
  if (!editor)
    return (
      <FormPageShell chrome="seller" backHref="/dashboard/materials" title="製品情報の管理">
        <EmptyState
          title="編集権の書類確認が必要です"
          description="この資材はまだ編集できません。掲載・オーナー権限の申請と資料を確認した後、運営が資材ごとに編集権を付与します。公開中の情報は引き続き閲覧できます。"
        />
      </FormPageShell>
    );
  return (
    <FormPageShell chrome="seller" backHref="/dashboard/materials" title="製品情報の管理">
      <div className={materialPageStack}>
        {audits.length > 0 ? (
          <SurfaceCard title="掲載後の確認記録">
            {audits.map((audit) => (
              <p key={audit.id}>
                {formatDateJa(audit.created_at)}／{audit.note}
              </p>
            ))}
          </SurfaceCard>
        ) : null}
        <SurfaceCard
          title={editor.material.name}
          description="製品名の変更は運営へご連絡ください。"
          tone="soft"
        >
          <DataList
            rows={[
              { label: "メーカー", value: editor.material.manufacturer_name },
              {
                label: "公開状態",
                value: editor.material.publication_status === "published" ? "公開中" : "非公開",
              },
              {
                label: "公開ページ",
                value: <TextLink href={`/materials/${id}`}>公開中の内容を見る</TextLink>,
              },
            ]}
          />
        </SurfaceCard>
        <MaterialPageEditor
          materialId={id}
          sellerId={session.data.sellerId}
          initialContent={editor.content}
          expectedVersion={editor.expectedVersion}
          pendingVersion={editor.pendingVersion}
          initialImageSources={editor.imageSources}
        />
        <SurfaceCard title="変更履歴">
          {editor.history.length === 0 ? (
            <p>保存した原稿はありません。</p>
          ) : (
            editor.history.map((version) => {
              const status = v.parse(
                v.picklist([
                  "draft",
                  "pending",
                  "published",
                  "returned",
                  "superseded",
                  "withdrawn",
                ]),
                version.status,
              );
              return (
                <div key={version.id}>
                  <TextLink href={`/dashboard/materials/${id}/history/${version.id}`}>
                    {formatDateJa(version.created_at)}／{MATERIAL_PAGE_STATUS_LABELS[status]}
                  </TextLink>
                  {version.review_note ? <p>{version.review_note}</p> : null}
                </div>
              );
            })
          )}
        </SurfaceCard>
        {editor.material.publication_status === "published" ? (
          <SurfaceCard title="公開を停止する">
            <HideMaterialPageForm materialId={id} />
          </SurfaceCard>
        ) : null}
      </div>
    </FormPageShell>
  );
}
