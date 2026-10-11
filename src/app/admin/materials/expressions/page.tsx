import { AdminShell } from "@/app/admin/_components/AdminShell";
import { adminBodyStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { SurfaceCard, TextLink, EmptyState, formatDateJa } from "@/components";
import {
  listMaterialPageReviews,
  listManufacturerProfileReviews,
} from "@/server/admin/material-page-review";

export default async function ExpressionReviewsPage() {
  await requireAdminPage("/admin/materials/expressions");
  const [result, profiles] = await Promise.all([
    listMaterialPageReviews(),
    listManufacturerProfileReviews(),
  ]);
  if (!profiles.ok) throw new Error("確認待ちのメーカープロフィールを取得できませんでした。");
  if (!result.ok) throw new Error("表現確認待ちの原稿を取得できませんでした。");
  return (
    <AdminShell
      title="製品情報の表現確認"
      description="メーカーが作成した原稿の表現を確認します。修正が必要な場合は、該当箇所と理由をメーカーへ返してください。"
    >
      {profiles.data.map((version) => (
        <SurfaceCard
          key={version.id}
          title={`${version.seller_accounts?.official_name}のプロフィール`}
        >
          <TextLink
            className={adminBodyStyle}
            href={`/admin/materials/expressions/profiles/${version.id}`}
          >
            会社紹介・ロゴ・リンクを確認
          </TextLink>
        </SurfaceCard>
      ))}
      {result.data.length === 0 && profiles.data.length === 0 ? (
        <EmptyState title="表現確認待ちの原稿はありません" />
      ) : (
        result.data.map((version) => (
          <SurfaceCard
            key={version.id}
            title={version.materials?.name}
            description={`${version.seller_accounts?.official_name}／${formatDateJa(version.created_at)}`}
          >
            <TextLink
              className={adminBodyStyle}
              href={`/admin/materials/expressions/${version.id}`}
            >
              原稿を確認
            </TextLink>
          </SurfaceCard>
        ))
      )}
    </AdminShell>
  );
}
