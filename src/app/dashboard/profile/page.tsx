import { redirect } from "next/navigation";
import * as v from "valibot";
import { FormPageShell, SurfaceCard, TextLink, formatDateJa } from "@/components";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { ManufacturerProfileSchema } from "@/lib/manufacturer-profile";
import { MATERIAL_PAGE_STATUS_LABELS } from "@/lib/material-page-editor";
import { requireSeller } from "@/server/auth";
import { getManufacturerProfileEditor } from "@/server/manufacturer-profile";
import { ManufacturerProfileEditor } from "./ManufacturerProfileEditor";

export default async function ManufacturerProfilePage() {
  const session = await requireSeller();
  if (!session.ok) redirect("/sellers/login?next=%2Fdashboard%2Fprofile");
  const { seller, versions } = await getManufacturerProfileEditor(session.data.sellerId);
  const latest = versions[0];
  const content = v.parse(ManufacturerProfileSchema, {
    profileText: latest?.profile_text ?? seller.profile_text ?? "",
    logoUrl: latest?.logo_url ?? seller.logo_url ?? "",
    websiteUrl: latest?.website_url ?? seller.website_url ?? "",
  });
  return (
    <FormPageShell chrome="seller" title="メーカープロフィールの編集" backHref="/dashboard">
      <div className={materialPageStack}>
        <p>
          会社紹介・ロゴ・公式サイトをメーカーページに掲載できます。法人名や担当者の変更は運営へご連絡ください。
        </p>
        <ManufacturerProfileEditor
          sellerId={seller.id}
          name={seller.official_name}
          regionScope={seller.region_scope}
          initialContent={content}
          expectedVersion={latest?.status === "draft" ? latest.id : null}
          pendingVersion={latest?.status === "pending" ? latest.id : null}
        />
        <SurfaceCard title="変更履歴">
          {versions.length === 0 ? (
            <p>保存したプロフィールはありません。</p>
          ) : (
            versions.map((version) => {
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
                <p key={version.id}>
                  <TextLink href={`/dashboard/profile/history/${version.id}`}>
                    {formatDateJa(version.created_at)}／{MATERIAL_PAGE_STATUS_LABELS[status]}
                  </TextLink>
                  {version.review_note ? `／${version.review_note}` : ""}
                </p>
              );
            })
          )}
        </SurfaceCard>
      </div>
    </FormPageShell>
  );
}
