import { redirect } from "next/navigation";
import * as v from "valibot";
import { FormPageShell } from "@/components/FormPageShell";
import { ManufacturerProfileSchema } from "@/lib/manufacturer-profile";
import { requireSeller } from "@/server/auth";
import { getManufacturerProfileEditor } from "@/server/manufacturer-profile";
import { readingColumn, sectionNote, visuallyHidden } from "../_components/dashboard-styles";
import { DashboardTabs } from "../_components/DashboardTabs";
import { ManufacturerProfileEditor } from "./ManufacturerProfileEditor";
import { ManufacturerProfileHistory } from "./ManufacturerProfileHistory";

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
      <div className={readingColumn}>
        <DashboardTabs active="profile" />
        <h1 className={visuallyHidden}>メーカープロフィールの編集</h1>
        <p className={sectionNote}>
          メーカーページに表示される会社情報を編集できます。会社紹介・ロゴ・公式サイトをメーカーページに掲載できます。法人名や担当者の変更は運営へご連絡ください。
        </p>
        <ManufacturerProfileEditor
          sellerId={seller.id}
          name={seller.official_name}
          regionScope={seller.region_scope}
          initialContent={content}
          expectedVersion={latest?.status === "draft" ? latest.id : null}
          pendingVersion={latest?.status === "pending" ? latest.id : null}
        />
        <ManufacturerProfileHistory versions={versions} />
      </div>
    </FormPageShell>
  );
}
