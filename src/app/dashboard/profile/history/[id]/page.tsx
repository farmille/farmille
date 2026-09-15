import { notFound, redirect } from "next/navigation";
import * as v from "valibot";
import { FormPageShell } from "@/components";
import { SellerHeader } from "@/app/sellers/[id]/_components/SellerHeader";
import { requireSeller } from "@/server/auth";
import { getManufacturerProfileVersion } from "@/server/manufacturer-profile";

export default async function ProfileHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSeller();
  if (!session.ok) redirect("/sellers/login");
  const { id } = await params;
  if (!v.is(v.pipe(v.string(), v.uuid()), id)) notFound();
  const version = await getManufacturerProfileVersion(id);
  if (!version || version.seller_id !== session.data.sellerId || !version.seller_accounts)
    notFound();
  return (
    <FormPageShell chrome="seller" title="保存したプロフィール" backHref="/dashboard/profile">
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
    </FormPageShell>
  );
}
