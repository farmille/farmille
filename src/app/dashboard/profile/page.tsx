import "../../_mock/dashboard.css";

import Link from "next/link";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { MockPageShell } from "@/app/_mock/MockPageShell";
import { formatDateJa } from "@/components";
import { ManufacturerProfileSchema } from "@/lib/manufacturer-profile";
import { MATERIAL_PAGE_STATUS_LABELS } from "@/lib/material-page-editor";
import { requireSeller } from "@/server/auth";
import { getManufacturerProfileEditor } from "@/server/manufacturer-profile";
import { DashboardTabs } from "../_components/DashboardTabs";
import { ManufacturerProfileEditor } from "./ManufacturerProfileEditor";

const versionStatusSchema = v.picklist([
  "draft",
  "pending",
  "published",
  "returned",
  "superseded",
  "withdrawn",
]);

/** 見本 S.makerDash の「メーカープロフィール」タブ。保存は原稿として表現確認を経て公開する。 */
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
    <MockPageShell title="メーカープロフィールの編集" backHref="/dashboard">
      <div className="dash-wide">
        <DashboardTabs active="profile" />
        <h1 className="sr-only">メーカープロフィールの編集</h1>
        <p className="md-sec-note">
          メーカーページに表示される、会社としての情報です。製品ごとの情報は「製品情報」で管理します。会社紹介・ロゴ・公式サイトをメーカーページに掲載できます。法人名や担当者の変更は運営へご連絡ください。
        </p>
        <ManufacturerProfileEditor
          sellerId={seller.id}
          name={seller.official_name}
          regionScope={seller.region_scope}
          initialContent={content}
          expectedVersion={latest?.status === "draft" ? latest.id : null}
          pendingVersion={latest?.status === "pending" ? latest.id : null}
        />
        <section aria-labelledby="profile-history-heading">
          <h2 id="profile-history-heading" className="dash-sec-h">
            変更履歴
          </h2>
          <p className="md-sec-note">プロフィールへの変更の記録です。</p>
          <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {versions.length === 0 ? (
              <li className="md-log">
                <div className="t">保存したプロフィールはありません。</div>
              </li>
            ) : (
              versions.map((version) => {
                const status = v.parse(versionStatusSchema, version.status);
                return (
                  <li className="md-log" key={version.id}>
                    <span className="d tnum">{formatDateJa(version.created_at)}</span>
                    <div className="t">
                      <Link href={`/dashboard/profile/history/${version.id}`}>
                        {MATERIAL_PAGE_STATUS_LABELS[status]}
                        <span className="sr-only">（{formatDateJa(version.created_at)}）</span>
                      </Link>
                      {version.review_note ? `／${version.review_note}` : ""}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </MockPageShell>
  );
}
