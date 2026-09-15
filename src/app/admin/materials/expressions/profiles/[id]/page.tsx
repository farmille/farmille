import { notFound } from "next/navigation";
import * as v from "valibot";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { SellerHeader } from "@/app/sellers/[id]/_components/SellerHeader";
import { getManufacturerProfileVersion } from "@/server/manufacturer-profile";
import { ExpressionReviewForm } from "../../ExpressionReviewForm";

export default async function ProfileReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/materials/expressions/profiles/${id}`);
  if (!v.is(v.pipe(v.string(), v.uuid()), id)) notFound();
  const version = await getManufacturerProfileVersion(id);
  if (!version || !version.seller_accounts) notFound();
  return (
    <AdminShell title="メーカープロフィールの表現確認" backHref="/admin/materials/expressions">
      <SellerHeader
        seller={{
          id: version.seller_id,
          officialName: version.seller_accounts.official_name,
          regionScope: version.seller_accounts.region_scope,
          profileText: version.profile_text,
          logoUrl: version.logo_url || null,
          websiteUrl: version.website_url || null,
        }}
      />
      {version.status === "pending" ? (
        <ExpressionReviewForm versionId={id} kind="profile" />
      ) : (
        <p>この原稿の確認は終了しています。</p>
      )}
    </AdminShell>
  );
}
